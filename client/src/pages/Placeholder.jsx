// Temporary stand-in — each module page replaces this per its PLANS doc
export default function Placeholder({ title, plan }) {
  return (
    <div className="rounded bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">Coming next — see {plan}</p>
    </div>
  )
}
