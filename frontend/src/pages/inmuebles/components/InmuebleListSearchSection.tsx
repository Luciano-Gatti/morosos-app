import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Inmueble, InmuebleFilters } from '../../../modules/inmuebles/types';

type InmuebleListSearchSectionProps = {
  filters: InmuebleFilters;
  onFiltersChange: (filters: InmuebleFilters) => void;
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => void;
  onResetFilters: () => void;
  inmuebles: Inmueble[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  onEdit: (inmueble: Inmueble) => void;
};

export function InmuebleListSearchSection({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  inmuebles,
  isLoading,
  isError,
  errorMessage,
  onEdit
}: InmuebleListSearchSectionProps) {
  return (
    <div className="inmuebles-section-block">
      <h3>Listado y búsqueda</h3>
      <form className="simple-form inmueble-filters-form" onSubmit={onApplyFilters}>
        <label>
          Número de cuenta
          <input
            value={filters.numeroCuenta ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, numeroCuenta: event.target.value })}
          />
        </label>
        <label>
          Propietario
          <input
            value={filters.propietarioNombre ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, propietarioNombre: event.target.value })}
          />
        </label>
        <label>
          Dirección
          <input
            value={filters.direccionCompleta ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, direccionCompleta: event.target.value })}
          />
        </label>
        <label>
          Distrito
          <input
            value={filters.distrito ?? ''}
            onChange={(event) => onFiltersChange({ ...filters, distrito: event.target.value })}
          />
        </label>
        <div className="actions align-right">
          <button type="submit">Buscar</button>
          <button type="button" className="secondary" onClick={onResetFilters}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {isLoading && <p>Cargando inmuebles...</p>}
      {isError && errorMessage && <p className="feedback error">{errorMessage}</p>}

      {!isLoading && !isError && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Número cuenta</th>
                <th>Propietario</th>
                <th>Dirección</th>
                <th>Distrito</th>
                <th>Grupo</th>
                <th>Activo</th>
                <th>Seguimiento habilitado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inmuebles.map((inmueble) => (
                <tr key={inmueble.id}>
                  <td>{inmueble.numeroCuenta}</td>
                  <td>{inmueble.propietarioNombre}</td>
                  <td>{inmueble.direccionCompleta}</td>
                  <td>{inmueble.distrito}</td>
                  <td>{inmueble.grupoNombre}</td>
                  <td>{inmueble.activo ? 'Sí' : 'No'}</td>
                  <td>{inmueble.seguimientoHabilitado ? 'Sí' : 'No'}</td>
                  <td>
                    <Link to={`/inmuebles/${inmueble.id}`}>Ver ficha</Link>{' '}
                    <button type="button" className="secondary" onClick={() => onEdit(inmueble)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {inmuebles.length === 0 && (
                <tr>
                  <td colSpan={8}>Sin inmuebles para los filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
