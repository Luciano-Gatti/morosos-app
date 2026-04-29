package pe.morosos.seguimiento.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkActionResultResponse {
    private int totalSolicitados;
    private int aplicados;
    private int omitidos;
    private int errores;
    private final List<BulkActionItemResultResponse> resultados = new ArrayList<>();

    public BulkActionResultResponse(int totalSolicitados) { this.totalSolicitados = totalSolicitados; }
    public int getTotalSolicitados() { return totalSolicitados; }
    public int getAplicados() { return aplicados; }
    public int getOmitidos() { return omitidos; }
    public int getErrores() { return errores; }
    public List<BulkActionItemResultResponse> getResultados() { return resultados; }
    public void aplicado(java.util.UUID id, String m){aplicados++;resultados.add(new BulkActionItemResultResponse(id, BulkActionItemResultResponse.Estado.APLICADO,m));}
    public void omitido(java.util.UUID id, String m){omitidos++;resultados.add(new BulkActionItemResultResponse(id, BulkActionItemResultResponse.Estado.OMITIDO,m));}
    public void error(java.util.UUID id, String m){errores++;resultados.add(new BulkActionItemResultResponse(id, BulkActionItemResultResponse.Estado.ERROR,m));}
}
