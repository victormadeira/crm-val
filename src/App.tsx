import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/lib/store";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Inbox } from "@/pages/Inbox";
import { Pipeline } from "@/pages/Pipeline";
import { Ranking } from "@/pages/Ranking";
import { Passaportes } from "@/pages/Passaportes";
import { SAC } from "@/pages/SAC";
import { Gamificacao } from "@/pages/Gamificacao";
import { WhatsAppConsole } from "@/pages/WhatsApp";
import { IAAprendizado } from "@/pages/IAAprendizado";
import { RouterIA } from "@/pages/Router";
import { Renovacoes } from "@/pages/Renovacoes";
import { Cadencias } from "@/pages/Cadencias";
import { Alertas } from "@/pages/Alertas";
import { Corretores } from "@/pages/Corretores";
import { Canais } from "@/pages/Canais";
import { Metas } from "@/pages/Metas";
import { Analytics } from "@/pages/Analytics";
import { Admin } from "@/pages/Admin";
import { Insights } from "@/pages/Insights";
import { Instagram } from "@/pages/Instagram";
import { MetaAds } from "@/pages/MetaAds";
import { Automacoes } from "@/pages/Automacoes";
import { Propostas } from "@/pages/Propostas";
import { Segmentos } from "@/pages/Segmentos";
import { Tracking } from "@/pages/Tracking";
import { Relatorios } from "@/pages/Relatorios";
import { Integracoes } from "@/pages/Integracoes";
import { Auditoria } from "@/pages/Auditoria";
import { LGPD } from "@/pages/LGPD";
import { Execucoes } from "@/pages/Execucoes";
import { ChatbotIA } from "@/pages/ChatbotIA";
import { VoiceAI } from "@/pages/VoiceAI";
import { Forecast } from "@/pages/Forecast";
import { Checkout } from "@/pages/Checkout";
import { Agenda } from "@/pages/Agenda";
import { LandingBuilder } from "@/pages/LandingBuilder";
import { EmailMarketing } from "@/pages/EmailMarketing";
import { TestesAB } from "@/pages/TestesAB";
import { Unidades } from "@/pages/Unidades";
import { Comunicacao } from "@/pages/Comunicacao";
import { MeuEspaco } from "@/pages/MeuEspaco";
import { Operacoes } from "@/pages/Operacoes";
import { Placeholder } from "@/pages/Placeholder";

function Protected({ children }: { children: React.ReactNode }) {
  const persona = useApp((s) => s.persona);
  if (!persona) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const persona = useApp((s) => s.persona);
  const isCorretor = persona?.papel === "corretor";
  const isSAC = persona?.papel === "sac";

  return (
    <div className="h-screen">
      <Routes>
        <Route
          path="/login"
          element={
            persona ? <Navigate to="/" replace /> : <Login />
          }
        />

        <Route
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route
            index
            element={
              isCorretor ? (
                <Navigate to="/whatsapp" replace />
              ) : isSAC ? (
                <Navigate to="/sac" replace />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/whatsapp" element={<WhatsAppConsole />} />
          <Route path="/ia-aprendizado" element={<IAAprendizado />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route
            path="/router"
            element={
              isCorretor || isSAC ? <Navigate to="/" replace /> : <RouterIA />
            }
          />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/passaportes" element={<Passaportes />} />
          <Route path="/sac" element={<SAC />} />
          <Route path="/gamificacao" element={<Gamificacao />} />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/canais" element={<Canais />} />
          <Route path="/renovacoes" element={<Renovacoes />} />
          <Route path="/cadencias" element={<Cadencias />} />
          <Route path="/corretores" element={<Corretores />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/alertas" element={<Alertas />} />

          <Route path="/instagram" element={<Instagram />} />
          <Route path="/meta-ads" element={<MetaAds />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/segmentos" element={<Segmentos />} />
          <Route path="/automacoes" element={<Automacoes />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/integracoes" element={<Integracoes />} />

          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/lgpd" element={<LGPD />} />
          <Route path="/execucoes" element={<Execucoes />} />
          <Route path="/chatbot" element={<ChatbotIA />} />
          <Route path="/voice-ai" element={<VoiceAI />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/landings" element={<LandingBuilder />} />
          <Route path="/email" element={<EmailMarketing />} />
          <Route path="/testes-ab" element={<TestesAB />} />
          <Route path="/unidades" element={<Unidades />} />
          <Route path="/comunicacao" element={<Comunicacao />} />
          <Route path="/operacoes" element={<Operacoes />} />
          <Route path="/meu-espaco" element={<MeuEspaco />} />

          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  );
}
