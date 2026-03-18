import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustes de la aplicación
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-mono">0.1.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Región AWS</span>
              <span className="font-mono">
                {process.env.AWS_REGION || process.env.ADMIN_AWS_REGION || "us-east-1"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usuario AWS</span>
              <span className="font-mono text-xs">
                {process.env.AWS_USERNAME || process.env.ADMIN_AWS_USERNAME || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base de Datos</span>
              <Badge variant="secondary">
                {process.env.DATABASE_URL ? "Conectada" : "No configurada"}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cognito</span>
              <Badge variant="secondary">
                {process.env.COGNITO_USER_POOL_ID
                  ? "Configurado"
                  : "Modo desarrollo"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Cache de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TTL Diario</span>
              <span className="font-mono">6 horas</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TTL Mensual</span>
              <span className="font-mono">24 horas</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                TTL Credenciales STS
              </span>
              <span className="font-mono">50 minutos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Fase 2 (Próximamente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Stop/Start EC2</Badge>
              <Badge variant="outline">Pausar Lambda</Badge>
              <Badge variant="outline">Eliminar Usuarios IAM</Badge>
              <Badge variant="outline">Alertas de Presupuesto</Badge>
              <Badge variant="outline">Notificaciones Slack/Email</Badge>
              <Badge variant="outline">Insights con IA</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
