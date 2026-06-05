package pe.morosos.auth.admin.dto;

import java.util.List;

public record ApproveUserRequest(List<String> roles, List<String> permissions) {}
