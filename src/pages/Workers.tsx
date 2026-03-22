import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkers } from '../lib/useSupabaseQuery'
import { useLoading } from '../lib/LoadingContext'

interface WorkerForm {
  id?: number
  name: string
  phone: string
  role: string
  daily_rate: number
  status: 'active' | 'inactive'
}

const emptyForm: WorkerForm = {
  name: '',
  phone: '',
  role: '',
  daily_rate: 0,
  status: 'active',
}

export default function Workers() {
  const [showInactive, setShowInactive] = useState(false)
  const { data: allWorkers, refetch } = useWorkers()
  const [editing, setEditing] = useState<WorkerForm | null>(null)
  const { withLoading } = useLoading()

  const workers = allWorkers?.filter(
    (w: any) => showInactive || w.status === 'active'
  )

  async function handleSave() {
    if (!editing || !editing.name || !editing.daily_rate) return

    await withLoading(async () => {
      if (editing.id) {
        await supabase
          .from('workers')
          .update({
            name: editing.name,
            phone: editing.phone,
            role: editing.role,
            daily_rate: editing.daily_rate,
            status: editing.status,
          })
          .eq('id', editing.id)
      } else {
        await supabase.from('workers').insert({
          name: editing.name,
          phone: editing.phone,
          role: editing.role,
          daily_rate: editing.daily_rate,
          status: editing.status,
        })
      }
      setEditing(null)
      await refetch()
    })
  }

  async function toggleStatus(worker: any) {
    await withLoading(async () => {
      await supabase
        .from('workers')
        .update({ status: worker.status === 'active' ? 'inactive' : 'active' })
        .eq('id', worker.id)
      await refetch()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-900">Workers</h2>
        <button
          onClick={() => setEditing({ ...emptyForm })}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
        >
          + Add Worker
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="rounded"
        />
        Show inactive workers
      </label>

      {editing && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 space-y-3">
          <h3 className="font-semibold text-green-900">
            {editing.id ? 'Edit Worker' : 'New Worker'}
          </h3>
          <input
            placeholder="Name"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Phone"
            value={editing.phone}
            onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Role (e.g., laborer, supervisor)"
            value={editing.role}
            onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Daily Rate"
            value={editing.daily_rate || ''}
            onChange={(e) =>
              setEditing({ ...editing, daily_rate: Number(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(null)}
              className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workers?.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No workers yet. Add your first worker above.
          </p>
        )}
        {workers?.map((worker: any) => (
          <div
            key={worker.id}
            className={`bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between ${
              worker.status === 'inactive'
                ? 'border-gray-200 opacity-60'
                : 'border-green-100'
            }`}
          >
            <div>
              <p className="font-semibold text-green-900">{worker.name}</p>
              <p className="text-sm text-gray-500">
                {worker.role} · ₹{worker.daily_rate}/day
              </p>
              {worker.phone && (
                <p className="text-sm text-gray-400">{worker.phone}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setEditing({
                    id: worker.id,
                    name: worker.name,
                    phone: worker.phone,
                    role: worker.role,
                    daily_rate: worker.daily_rate,
                    status: worker.status,
                  })
                }
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => toggleStatus(worker)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                {worker.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
