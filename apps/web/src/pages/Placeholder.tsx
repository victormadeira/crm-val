import { Construction } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function Placeholder({
  title,
  subtitle,
  module,
}: {
  title: string;
  subtitle?: string;
  module: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <PageContent>
        <Card>
          <CardBody className="py-20 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand-500 to-aqua-500 text-white shadow-pop mb-4">
              <Construction className="h-6 w-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-slate-900">
              Módulo em construção
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
              A tela de {module} faz parte do roadmap e será entregue na próxima
              sprint do plano PRD v1.
            </p>
            <div className="mt-5">
              <Badge tone="violet">Próxima sprint</Badge>
            </div>
          </CardBody>
        </Card>
      </PageContent>
    </>
  );
}
