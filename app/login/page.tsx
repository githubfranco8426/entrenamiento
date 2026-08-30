"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrenamiento</CardTitle>
          <CardDescription>Periodización y autoregulación con IA</CardDescription>
        </CardHeader>
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
                  <Button type="submit" disabled={loading} className="mt-2">
                    {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </Button>
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
    </div>
  );
}
