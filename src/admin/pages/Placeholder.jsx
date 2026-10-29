/** Page provisoire d'une section d'administration (remplacée par chaque tâche suivante). */
export default function Placeholder({ title }) {
  return (
    <section>
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      <p className="mt-3 text-slate-700">Cette section sera bientôt disponible.</p>
    </section>
  )
}
