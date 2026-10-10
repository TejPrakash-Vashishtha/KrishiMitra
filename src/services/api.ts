import axios, { AxiosResponse } from "axios";
import {
  PRESET_DILEMMAS,
  runMultiAgentDeliberation,
  verifyAndGenerateRAG,
  AGRONOMY_CORPUS,
  FALLBACK_NOTIFICATIONS,
} from "./mockBackend";

const api = axios.create({
  baseURL: "/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("km_auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Fallback response creator for when standalone backend is not active
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const url: string = config.url || "";
    const method: string = (config.method || "get").toLowerCase();
    let body: any = {};
    if (config.data) {
      try {
        body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      } catch {
        body = {};
      }
    }

    // 1. Multi-Agent Deliberation
    if (url.includes("/multi-agent/presets")) {
      return createMockResponse(config, { success: true, presets: PRESET_DILEMMAS });
    }
    if (url.includes("/multi-agent/deliberate")) {
      const output = runMultiAgentDeliberation(body.dilemma, body.cropName, body.district);
      return createMockResponse(config, { success: true, ...output });
    }

    // 2. Agronomy RAG & Guardrails
    if (url.includes("/rag/query")) {
      const query = body.query || "Recommended practices";
      const result = verifyAndGenerateRAG(query);
      return createMockResponse(config, { success: true, ...result });
    }
    if (url.includes("/rag/sources")) {
      return createMockResponse(config, {
        success: true,
        sources: AGRONOMY_CORPUS.map((c) => ({
          id: c.id,
          sourceDoc: c.sourceDoc,
          publisher: c.publisher,
          chapter: c.chapterOrSection,
          cropOrDomain: c.cropOrDomain,
        })),
      });
    }

    // 3. Notifications
    if (url.includes("/notifications")) {
      return createMockResponse(config, { success: true, notifications: FALLBACK_NOTIFICATIONS });
    }

    // 4. Admin stats
    if (url.includes("/admin/stats")) {
      return createMockResponse(config, {
        success: true,
        stats: {
          totalUsers: 38,
          totalDiagnoses: 142,
          totalProducts: 18,
          verifiedDealers: 12,
        },
      });
    }

    // 5. Crop posts
    if (url.includes("/crop-posts")) {
      return createMockResponse(config, { success: true, posts: [], message: "Post saved successfully" });
    }

    // 6. Chat endpoints
    if (url.includes("/chat")) {
      return createMockResponse(config, { success: true, conversations: [], messages: [] });
    }

    // 7. General fallback
    if (method === "get") {
      return createMockResponse(config, { success: true, data: [] });
    }

    return createMockResponse(config, { success: true });
  }
);

function createMockResponse(config: any, data: any): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}

export default api;
