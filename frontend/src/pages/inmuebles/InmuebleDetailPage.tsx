import { useParams } from 'react-router-dom';

export function InmuebleDetailPage() {
  const { inmuebleId } = useParams();

  return (
    <section>
      <h2>Detalle de inmueble</h2>
      <p>Vista base para organizar tabs de deuda, casos, etapas, compromisos y cortes.</p>
      <p>
        <strong>ID:</strong> {inmuebleId}
      </p>
    </section>
  );
}
