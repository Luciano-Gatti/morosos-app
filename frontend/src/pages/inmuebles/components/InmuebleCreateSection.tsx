import { FormEvent } from 'react';
import type { Grupo } from '../../../modules/grupos/types';

type InmuebleForm = {
  numeroCuenta: string;
  propietarioNombre: string;
  distrito: string;
  direccionCompleta: string;
  grupoId: string;
  activo: boolean;
};

type InmuebleCreateSectionProps = {
  form: InmuebleForm;
  editing: boolean;
  grupos: Grupo[];
  submitLabel: string;
  isSubmitting: boolean;
  onFormChange: (form: InmuebleForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

export function InmuebleCreateSection({
  form,
  editing,
  grupos,
  submitLabel,
  isSubmitting,
  onFormChange,
  onSubmit,
  onCancelEdit
}: InmuebleCreateSectionProps) {
  return (
    <div className="inmuebles-section-block">
      <h3>{editing ? 'Editar inmueble' : 'Crear inmueble'}</h3>
      <form className="simple-form inmueble-form-grid" onSubmit={onSubmit}>
        <label>
          Número de cuenta
          <input
            required
            maxLength={40}
            value={form.numeroCuenta}
            onChange={(event) => onFormChange({ ...form, numeroCuenta: event.target.value })}
          />
        </label>
        <label>
          Propietario
          <input
            required
            maxLength={120}
            value={form.propietarioNombre}
            onChange={(event) => onFormChange({ ...form, propietarioNombre: event.target.value })}
          />
        </label>
        <label>
          Distrito
          <input
            required
            maxLength={80}
            value={form.distrito}
            onChange={(event) => onFormChange({ ...form, distrito: event.target.value })}
          />
        </label>
        <label>
          Dirección completa
          <input
            required
            maxLength={220}
            value={form.direccionCompleta}
            onChange={(event) => onFormChange({ ...form, direccionCompleta: event.target.value })}
          />
        </label>
        <label>
          Grupo
          <select
            required
            value={form.grupoId}
            onChange={(event) => onFormChange({ ...form, grupoId: event.target.value })}
          >
            <option value="">Seleccionar grupo</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field inmueble-checkbox-field">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => onFormChange({ ...form, activo: event.target.checked })}
          />
          Activo
        </label>

        <div className="actions align-right inmueble-form-actions">
          <button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </button>
          {editing && (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
