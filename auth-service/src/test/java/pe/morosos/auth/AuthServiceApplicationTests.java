package pe.morosos.auth;

import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.morosos.auth.common.HttpHeadersConstants;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthServiceApplicationTests extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointReturnsServiceStatusAndRequestId() throws Exception {
        mockMvc.perform(get("/api/v1/auth-service/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("auth-service"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(header().string(HttpHeadersConstants.REQUEST_ID, not(blankOrNullString())));
    }

    @Test
    void healthEndpointEchoesIncomingRequestId() throws Exception {
        mockMvc.perform(get("/api/v1/auth-service/health")
                        .header(HttpHeadersConstants.REQUEST_ID, "test-request-id"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeadersConstants.REQUEST_ID, "test-request-id"));
    }
}
