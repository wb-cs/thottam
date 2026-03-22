import { useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabase'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import { useLoading } from '../lib/LoadingContext'

type Tab = 'catalog' | 'harvest' | 'sales' | 'stock'

const tabs: { key: Tab; label: string }[] = [
  { key: 'catalog', label: 'Catalog' },
  { key: 'harvest', label: 'Harvest' },
  { key: 'sales', label: 'Sales' },
  { key: 'stock', label: 'Stock' },
]

const categories = ['crop', 'dairy', 'livestock', 'other'] as const

export default function Produce() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog')

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-green-900">Produce</h2>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' && <CatalogTab />}
      {activeTab === 'harvest' && <HarvestTab />}
      {activeTab === 'sales' && <SalesTab />}
      {activeTab === 'stock' && <StockTab />}
    </div>
  )
}

/* ── Catalog Tab ── */
function CatalogTab() {
  const { withLoading } = useLoading()
  const { data: items, refetch } = useSupabaseQuery(
    () => supabase.from('produce').select('*').order('name'),
    []
  )
  const [editing, setEditing] = useState<any>(null)
  const [showInactive, setShowInactive] = useState(false)

  const filtered = items?.filter(
    (p: any) => showInactive || p.status === 'active'
  )

  async function handleSave() {
    if (!editing?.name) return
    await withLoading(async () => {
      if (editing.id) {
        await supabase
          .from('produce')
          .update({
            name: editing.name,
            unit: editing.unit,
            category: editing.category,
            status: editing.status,
          })
          .eq('id', editing.id)
      } else {
        await supabase.from('produce').insert({
          name: editing.name,
          unit: editing.unit,
          category: editing.category,
        })
      }
      setEditing(null)
      await refetch()
    })
  }

  async function toggleStatus(item: any) {
    await withLoading(async () => {
      await supabase
        .from('produce')
        .update({ status: item.status === 'active' ? 'inactive' : 'active' })
        .eq('id', item.id)
      await refetch()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
        <button
          onClick={() =>
            setEditing({ name: '', unit: 'kg', category: 'crop', status: 'active' })
          }
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
        >
          + Add
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 space-y-3">
          <input
            placeholder="Name (e.g., Coconut)"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <div className="flex gap-2">
            <input
              placeholder="Unit (kg, count, litre)"
              value={editing.unit}
              onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <select
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
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

      {filtered?.length === 0 && (
        <p className="text-gray-500 text-center py-8">No produce items yet.</p>
      )}

      {filtered?.map((item: any) => (
        <div
          key={item.id}
          className={`bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between ${
            item.status === 'inactive' ? 'border-gray-200 opacity-60' : 'border-green-100'
          }`}
        >
          <div>
            <p className="font-semibold text-green-900">{item.name}</p>
            <p className="text-sm text-gray-500">
              {item.category} · {item.unit}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(item)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => toggleStatus(item)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              {item.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Harvest Tab ── */
function HarvestTab() {
  const { withLoading } = useLoading()
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [produceId, setProduceId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const { data: produceItems } = useSupabaseQuery(
    () => supabase.from('produce').select('*').eq('status', 'active').order('name'),
    []
  )

  const { data: harvests, refetch } = useSupabaseQuery(
    () =>
      supabase
        .from('harvests')
        .select('*, produce(name, unit)')
        .order('date', { ascending: false })
        .limit(50),
    []
  )

  async function addHarvest() {
    if (!produceId || quantity <= 0) return
    await withLoading(async () => {
      await supabase.from('harvests').insert({
        produce_id: produceId,
        date,
        quantity,
        notes: notes.trim(),
      })
      setQuantity(0)
      setNotes('')
      await refetch()
    })
  }

  async function deleteHarvest(id: number) {
    await withLoading(async () => {
      await supabase.from('harvests').delete().eq('id', id)
      await refetch()
    })
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 space-y-2">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={produceId}
            onChange={(e) => setProduceId(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select produce</option>
            {produceItems?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Quantity"
            value={quantity || ''}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={addHarvest}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 w-full"
        >
          Log Harvest
        </button>
      </div>

      {harvests?.length === 0 && (
        <p className="text-gray-500 text-center py-4">No harvests logged yet.</p>
      )}

      {harvests?.map((h: any) => (
        <div
          key={h.id}
          className="bg-white rounded-xl p-3 shadow-sm border border-green-100 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-green-900 text-sm">
              {h.produce?.name}
              <span className="text-gray-400 font-normal">
                {' '}· {h.quantity} {h.produce?.unit}
              </span>
            </p>
            <p className="text-xs text-gray-400">
              {dayjs(h.date).format('MMM D, YYYY')}
              {h.notes && ` · ${h.notes}`}
            </p>
          </div>
          <button
            onClick={() => deleteHarvest(h.id)}
            className="text-gray-400 hover:text-red-500 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

/* ── Sales Tab ── */
function SalesTab() {
  const { withLoading } = useLoading()
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [produceId, setProduceId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [pricePerUnit, setPricePerUnit] = useState<number>(0)
  const [buyer, setBuyer] = useState('')
  const [notes, setNotes] = useState('')

  const { data: produceItems } = useSupabaseQuery(
    () => supabase.from('produce').select('*').eq('status', 'active').order('name'),
    []
  )

  const { data: sales, refetch } = useSupabaseQuery(
    () =>
      supabase
        .from('sales')
        .select('*, produce(name, unit)')
        .order('date', { ascending: false })
        .limit(50),
    []
  )

  async function addSale() {
    if (!produceId || quantity <= 0) return
    await withLoading(async () => {
      await supabase.from('sales').insert({
        produce_id: produceId,
        date,
        quantity,
        price_per_unit: pricePerUnit,
        buyer: buyer.trim(),
        notes: notes.trim(),
      })
      setQuantity(0)
      setPricePerUnit(0)
      setBuyer('')
      setNotes('')
      await refetch()
    })
  }

  async function deleteSale(id: number) {
    await withLoading(async () => {
      await supabase.from('sales').delete().eq('id', id)
      await refetch()
    })
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 space-y-2">
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={produceId}
            onChange={(e) => setProduceId(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select produce</option>
            {produceItems?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Quantity"
            value={quantity || ''}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Price per unit (₹)"
            value={pricePerUnit || ''}
            onChange={(e) => setPricePerUnit(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Buyer (optional)"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={addSale}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 w-full"
        >
          Log Sale
        </button>
      </div>

      {sales?.length === 0 && (
        <p className="text-gray-500 text-center py-4">No sales logged yet.</p>
      )}

      {sales?.map((s: any) => (
        <div
          key={s.id}
          className="bg-white rounded-xl p-3 shadow-sm border border-green-100 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-green-900 text-sm">
              {s.produce?.name}
              <span className="text-gray-400 font-normal">
                {' '}· {s.quantity} {s.produce?.unit} @ ₹{s.price_per_unit}
              </span>
            </p>
            <p className="text-xs text-gray-400">
              {dayjs(s.date).format('MMM D, YYYY')}
              <span className="text-green-600 font-medium">
                {' '}· ₹{(s.quantity * s.price_per_unit).toLocaleString('en-IN')}
              </span>
              {s.buyer && ` · ${s.buyer}`}
            </p>
          </div>
          <button
            onClick={() => deleteSale(s.id)}
            className="text-gray-400 hover:text-red-500 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

/* ── Stock Tab ── */
function StockTab() {
  const { data: produceItems } = useSupabaseQuery(
    () => supabase.from('produce').select('*').eq('status', 'active').order('name'),
    []
  )

  const { data: harvests } = useSupabaseQuery(
    () => supabase.from('harvests').select('produce_id, quantity'),
    []
  )

  const { data: sales } = useSupabaseQuery(
    () => supabase.from('sales').select('produce_id, quantity'),
    []
  )

  function getStock(produceId: number) {
    const totalHarvested =
      harvests
        ?.filter((h: any) => h.produce_id === produceId)
        .reduce((sum: number, h: any) => sum + Number(h.quantity), 0) ?? 0
    const totalSold =
      sales
        ?.filter((s: any) => s.produce_id === produceId)
        .reduce((sum: number, s: any) => sum + Number(s.quantity), 0) ?? 0
    return { totalHarvested, totalSold, inStock: totalHarvested - totalSold }
  }

  const stockData =
    produceItems?.map((p: any) => ({
      ...p,
      ...getStock(p.id),
    })) ?? []

  return (
    <div className="space-y-3">
      {stockData.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No produce items. Add items in the Catalog tab.
        </p>
      )}

      {stockData.map((item: any) => (
        <div
          key={item.id}
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-green-900">{item.name}</p>
              <p className="text-xs text-gray-400">{item.category}</p>
            </div>
            <p
              className={`text-xl font-bold ${
                item.inStock > 0 ? 'text-green-700' : item.inStock < 0 ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {item.inStock}
              <span className="text-sm font-normal text-gray-400"> {item.unit}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-gray-500">Harvested</p>
              <p className="font-semibold text-green-800">{item.totalHarvested}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-gray-500">Sold</p>
              <p className="font-semibold text-blue-800">{item.totalSold}</p>
            </div>
            <div className={`rounded-lg p-2 ${item.inStock > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-gray-500">In Stock</p>
              <p className={`font-semibold ${item.inStock > 0 ? 'text-green-800' : 'text-red-800'}`}>
                {item.inStock}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
