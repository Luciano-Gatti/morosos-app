import { useNavigate, useParams } from 'react-router-dom';

export function InmuebleDetailPage() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();

  return (
    <section>
      <div className="section-title">
        <h2>Detalle de inmueble</h2>
        <button type="button" className="secondary" onClick={() => navigate('/inmuebles')}>
          Volver a inmuebles
        </button>
      </div>
      <p>Vista base para organizar tabs de deuda, casos, etapas, compromisos y cortes.</p>
      <p>
        <strong>ID:</strong> {inmuebleId}
      </p>
    </section>
  );
}
