"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Fingerprint, Gauge, Waves, HeartPulse, PlayIcon } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Gauge,
    title: "RPE & RIR Adaptativo",
    description: "Ajuste dinámico de sobrecarga entre-serie según tu esfuerzo real.",
    tag: "+0.25 RIR",
  },
  {
    icon: Waves,
    title: "Periodización Ondulante IA",
    description: "Macrociclos y microciclos ajustados por fatiga, no solo por fecha.",
    tag: "DUP/AUTO",
  },
  {
    icon: HeartPulse,
    title: "Readiness & Fatiga en Vivo",
    description: "Monitoreo del sistema nervioso central antes de cada sesión.",
    tag: "VFC · RIR",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    toast.success("Cuenta creada. Si tu proyecto requiere confirmación, revisá tu correo.");
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setResetSent(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-gutter-lg bg-background px-container-padding py-gutter-xl">
      <div className="relative flex flex-col items-center gap-2 text-center">
        <div className="pointer-events-none absolute -top-6 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex size-20 items-center justify-center rounded-2xl bg-card shadow-xl shadow-background/60 ring-1 ring-border">
          <Dumbbell className="size-10 text-primary" />
          <span className="absolute -bottom-1 -right-1 flex size-3.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex size-3.5 rounded-full bg-secondary" />
          </span>
        </div>
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight">Entrenamiento</h1>
        <p className="text-sm text-muted-foreground">Periodización y autoregulación con IA</p>
        <span className="mt-1 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
          Motor neuronal v2.4 · Listo
        </span>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent>
          {forgotPassword ? (
            resetSent ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Si <span className="font-medium text-foreground">{email}</span> tiene una cuenta,
                  te mandamos un enlace para elegir una contraseña nueva. Revisá tu correo.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setForgotPassword(false);
                    setResetSent(false);
                  }}
                >
                  Volver a iniciar sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Ingresá tu email y te mandamos un enlace para elegir una contraseña nueva.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setForgotPassword(false)}>
                  Volver a iniciar sesión
                </Button>
              </form>
            )
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="login" className="flex-1">
                  Iniciar sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Crear cuenta
                </TabsTrigger>
              </TabsList>
              <TabsContent value={mode}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="mt-2 gap-1.5 font-semibold uppercase tracking-wide">
                    {mode === "login" && <PlayIcon className="size-4" />}
                    {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </Button>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => toast.info("Acceso biométrico: todavía no disponible")}
                      className="flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Fingerprint className="size-3.5" />
                      Acceso biométrico rápido con FaceID
                    </button>
                  )}
                  {mode === "login" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setForgotPassword(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Capacidades de alto rendimiento
        </p>
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.title}
            className="flex items-start gap-3 rounded-xl bg-card px-3.5 py-3 ring-1 ring-border"
          >
            <cap.icon className="mt-0.5 size-4 shrink-0 text-secondary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{cap.title}</p>
              <p className="text-xs text-muted-foreground">{cap.description}</p>
            </div>
            <span className="whitespace-nowrap font-mono text-[10px] text-secondary">{cap.tag}</span>
          </div>
        ))}
        <p className="pt-2 text-center text-xs italic text-muted-foreground">
          &ldquo;La fuerza no es contentar; es ciencia y precisión algorítmica.&rdquo;
        </p>
      </div>
    </div>
  );
}
