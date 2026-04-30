package pe.morosos.common.api;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;

public record PageResponse<T>(List<T> content,int page,int size,long totalElements,int totalPages,List<String> sort) {
    public PageResponse(List<T> content,int page,int size,long totalElements,int totalPages){
        this(content,page,size,totalElements,totalPages,List.of());
    }
    public static <T> PageResponse<T> from(Page<T> page){
        List<String> sort = page.getSort().stream()
                .map(o -> o.getProperty() + "," + o.getDirection().name())
                .toList();
        return new PageResponse<>(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages(), sort);
    }
}
