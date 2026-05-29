package pe.morosos.auth.dto;

import java.util.List;

public record UserAuthorities(List<String> roles, List<String> permissions) {
}
