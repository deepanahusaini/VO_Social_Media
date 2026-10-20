import { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api, getErrorMessage } from '../api/client.js';
import { DEFAULT_LAYOUT, FONTS, SECTION_LABELS, THEME_PRESETS } from '../lib/constants.js';

function SortableSection({ id, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab touch-none items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 active:cursor-grabbing ${
        isDragging ? 'z-10 border-violet-500 shadow-lg shadow-violet-500/20' : ''
      }`}
    >
      <span className="text-zinc-500">☰</span>
      <span className="text-xs text-zinc-500">{index + 1}.</span>
      <span className="font-medium">{SECTION_LABELS[id]}</span>
    </li>
  );
}

export default function LayoutEditor({ layout, onSaved }) {
  const initial = { ...DEFAULT_LAYOUT, ...layout };
  const [themeColor, setThemeColor] = useState(initial.themeColor);
  const [font, setFont] = useState(initial.font);
  const [order, setOrder] = useState(initial.sectionOrder);
  const [status, setStatus] = useState({ saving: false, msg: '', error: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setOrder((o) => arrayMove(o, o.indexOf(active.id), o.indexOf(over.id)));
    }
  };

  const save = async () => {
    setStatus({ saving: true, msg: '', error: '' });
    try {
      const { data } = await api.put('/artists/me/layout', { themeColor, font, sectionOrder: order });
      onSaved(data.profile);
      setStatus({ saving: false, msg: 'Layout saved', error: '' });
    } catch (err) {
      setStatus({ saving: false, msg: '', error: getErrorMessage(err) });
    }
  };

  return (
    <section className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold">Layout editor</h2>
        <p className="text-sm text-zinc-400">Personalize how your public profile looks.</p>
      </div>

      <div>
        <span className="label">Theme color</span>
        <div className="flex flex-wrap items-center gap-2">
          {THEME_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Theme ${c}`}
              onClick={() => setThemeColor(c)}
              className={`h-9 w-9 rounded-full border-2 ${themeColor === c ? 'border-white' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
          <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg bg-transparent" aria-label="Custom theme color" />
          <code className="text-xs text-zinc-400">{themeColor}</code>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="font">Font</label>
        <select id="font" className="input" value={font} onChange={(e) => setFont(e.target.value)}>
          {Object.entries(FONTS).map(([key, f]) => (
            <option key={key} value={key}>{f.label}</option>
          ))}
        </select>
        <p className="mt-2 text-2xl" style={{ fontFamily: FONTS[font].css, color: themeColor }}>
          The quick brown fox narrates.
        </p>
      </div>

      <div>
        <span className="label">Section order (drag to reorder)</span>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {order.map((id, i) => <SortableSection key={id} id={id} index={i} />)}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={status.saving} className="btn-primary">
          {status.saving ? 'Saving…' : 'Save layout'}
        </button>
        {status.msg && <span className="text-sm text-emerald-400">{status.msg}</span>}
        {status.error && <span className="text-sm text-red-400">{status.error}</span>}
      </div>
    </section>
  );
}
