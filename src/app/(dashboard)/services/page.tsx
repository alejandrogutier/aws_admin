import { Suspense } from "react";
import { getFilteredAccounts } from "@/lib/accounts";
import * as ec2Lib from "@/lib/aws/ec2";
import * as lambdaLib from "@/lib/aws/lambda";
import * as rdsLib from "@/lib/aws/rds";
import * as s3Lib from "@/lib/aws/s3";
import * as ecsLib from "@/lib/aws/ecs";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceStatusBadge } from "@/components/services/service-status-badge";
import type {
  Ec2Instance,
  LambdaFunction,
  RdsInstance,
  S3Bucket,
  EcsService,
} from "@/types/aws";

async function ServicesContent({
  accountId,
}: {
  accountId: string | undefined;
}) {
  const accounts = await getFilteredAccounts(accountId);

  const allEc2: Ec2Instance[] = [];
  const allLambda: LambdaFunction[] = [];
  const allRds: RdsInstance[] = [];
  const allS3: S3Bucket[] = [];
  const allEcs: EcsService[] = [];

  for (const account of accounts) {
    const results = await Promise.allSettled([
      ec2Lib.listInstances(account.id, account.name),
      lambdaLib.listFunctions(account.id, account.name),
      rdsLib.listInstances(account.id, account.name),
      s3Lib.listBuckets(account.id, account.name),
      ecsLib.listServices(account.id, account.name),
    ]);

    if (results[0].status === "fulfilled") allEc2.push(...results[0].value);
    if (results[1].status === "fulfilled") allLambda.push(...results[1].value);
    if (results[2].status === "fulfilled") allRds.push(...results[2].value);
    if (results[3].status === "fulfilled") allS3.push(...results[3].value);
    if (results[4].status === "fulfilled") allEcs.push(...results[4].value);
  }

  return (
    <Tabs defaultValue="ec2">
      <TabsList>
        <TabsTrigger value="ec2">EC2 ({allEc2.length})</TabsTrigger>
        <TabsTrigger value="lambda">Lambda ({allLambda.length})</TabsTrigger>
        <TabsTrigger value="rds">RDS ({allRds.length})</TabsTrigger>
        <TabsTrigger value="s3">S3 ({allS3.length})</TabsTrigger>
        <TabsTrigger value="ecs">ECS ({allEcs.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="ec2">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>AZ</TableHead>
                  <TableHead>IP Pública</TableHead>
                  <TableHead>Cuenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEc2.map((i) => (
                  <TableRow key={`${i.accountId}-${i.instanceId}`}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="font-mono text-xs">{i.instanceId}</TableCell>
                    <TableCell className="font-mono text-xs">{i.type}</TableCell>
                    <TableCell><ServiceStatusBadge status={i.state} /></TableCell>
                    <TableCell className="text-xs">{i.availabilityZone}</TableCell>
                    <TableCell className="font-mono text-xs">{i.publicIp || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.accountName}</TableCell>
                  </TableRow>
                ))}
                {allEc2.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No se encontraron instancias EC2
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="lambda">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Función</TableHead>
                  <TableHead>Runtime</TableHead>
                  <TableHead>Memoria</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Última Modificación</TableHead>
                  <TableHead>Cuenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLambda.map((fn) => (
                  <TableRow key={`${fn.accountId}-${fn.functionName}`}>
                    <TableCell className="font-medium font-mono text-sm">{fn.functionName}</TableCell>
                    <TableCell className="font-mono text-xs">{fn.runtime}</TableCell>
                    <TableCell className="font-mono text-xs">{fn.memorySize} MB</TableCell>
                    <TableCell className="font-mono text-xs">{fn.timeout}s</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fn.lastModified ? new Date(fn.lastModified).toLocaleDateString("es") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fn.accountName}</TableCell>
                  </TableRow>
                ))}
                {allLambda.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron funciones Lambda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rds">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DB ID</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Multi-AZ</TableHead>
                  <TableHead>Cuenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRds.map((db) => (
                  <TableRow key={`${db.accountId}-${db.dbInstanceId}`}>
                    <TableCell className="font-medium font-mono text-sm">{db.dbInstanceId}</TableCell>
                    <TableCell>{db.engine} {db.engineVersion}</TableCell>
                    <TableCell><ServiceStatusBadge status={db.status === "available" ? "running" : db.status} /></TableCell>
                    <TableCell className="font-mono text-xs">{db.instanceClass}</TableCell>
                    <TableCell>{db.multiAz ? "Sí" : "No"}</TableCell>
                    <TableCell className="text-muted-foreground">{db.accountName}</TableCell>
                  </TableRow>
                ))}
                {allRds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron instancias RDS
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="s3">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Cuenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allS3.map((bucket) => (
                  <TableRow key={`${bucket.accountId}-${bucket.name}`}>
                    <TableCell className="font-medium font-mono text-sm">{bucket.name}</TableCell>
                    <TableCell>{bucket.region}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bucket.creationDate ? new Date(bucket.creationDate).toLocaleDateString("es") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{bucket.accountName}</TableCell>
                  </TableRow>
                ))}
                {allS3.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No se encontraron buckets S3
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ecs">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Running</TableHead>
                  <TableHead>Desired</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cuenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEcs.map((svc) => (
                  <TableRow key={`${svc.accountId}-${svc.clusterName}-${svc.serviceName}`}>
                    <TableCell className="font-medium">{svc.serviceName}</TableCell>
                    <TableCell className="font-mono text-xs">{svc.clusterName}</TableCell>
                    <TableCell className="font-mono">{svc.runningCount}</TableCell>
                    <TableCell className="font-mono">{svc.desiredCount}</TableCell>
                    <TableCell><ServiceStatusBadge status={svc.status === "ACTIVE" ? "running" : "stopped"} /></TableCell>
                    <TableCell className="text-muted-foreground">{svc.accountName}</TableCell>
                  </TableRow>
                ))}
                {allEcs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron servicios ECS
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Servicios Activos
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos los recursos AWS por tipo de servicio
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px]" />}>
        <ServicesContent accountId={params.accountId} />
      </Suspense>
    </div>
  );
}
