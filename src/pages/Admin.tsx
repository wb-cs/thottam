import { useState, useEffect } from 'react'
import { useSettings } from '../lib/SettingsContext'
import { useLoading } from '../lib/LoadingContext'

export default function Admin() {
  const { farmName, updateFarmName } = useSettings()
  const { withLoading } = useLoading()
  const [name, setName] = useState(farmName)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(farmName)
  }, [farmName])

  async function handleSave() {
    if (!name.trim()) return
    await withLoading(async () => {
      await updateFarmName(name.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-900">Settings</h2>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 space-y-4">
        <h3 className="font-semibold text-green-900">Farm Details</h3>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Farm Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Enter farm name"
          />
          <p className="text-xs text-gray-400 mt-1">
            This appears in the header across the app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Save
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved!</span>
          )}
        </div>
      </div>
    </div>
  )
}
