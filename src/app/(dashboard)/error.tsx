"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <AlertTriangle className="mx-auto text-destructive" size={48} />
          <div>
            <h2 className="text-xl font-bold">Có lỗi xảy ra</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {error.message ?? "Đã xảy ra lỗi không mong đợi. Vui lòng thử lại."}
            </p>
          </div>
          <Button onClick={reset} className="gap-2">
            <RefreshCw size={16} />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
