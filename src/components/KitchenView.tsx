import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Clock, ChefHat, CheckCircle2, DollarSign, Package, RotateCcw } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const KitchenView = () => {
  const { tableOrders, updateOrderKitchenStatus, dispatchedOrders, resumeDispatchedOrder } = useRestaurant();
  const { toast } = useToast();

  // Obtener todas las comandas activas (sin las listas)
  const activeOrders = Object.values(tableOrders);

  // Función para obtener el estado general de la comanda
  const getOrderKitchenStatus = (order: any) => {
    const foodItems = order.items.filter((item: any) => item.category === "Comida");
    if (foodItems.length === 0) return null;

    if (foodItems.every((item: any) => item.kitchenStatus === "ready")) return "ready";
    if (foodItems.some((item: any) => item.kitchenStatus === "preparing")) return "preparing";
    return "pending";
  };

  const handleStartPreparing = (tableId: string, tableNumber: number) => {
    updateOrderKitchenStatus(tableId, "preparing");
    toast({
      title: "🔥 Preparación iniciada",
      description: `Comanda Mesa ${tableNumber} en preparación`,
    });
  };

  const handleMarkReady = (tableId: string, tableNumber: number) => {
    updateOrderKitchenStatus(tableId, "ready");
    toast({
      title: "✅ Comanda lista y despachada",
      description: `Mesa ${tableNumber} ha sido despachada`,
    });
  };

  const handleResumeOrder = (dispatchedOrder: any) => {
    resumeDispatchedOrder(dispatchedOrder.id);
    toast({
      title: "↩️ Comanda retomada",
      description: `Mesa ${dispatchedOrder.tableNumber} volvió a Preparando`,
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Filtrar solo comandas activas con comida (excluir las que están "ready")
  const ordersWithFood = activeOrders.filter(order => {
    const hasFood = order.items.some(item => item.category === "Comida");
    const status = getOrderKitchenStatus(order);
    return hasFood && status !== "ready";
  });

  // Estadísticas
  const stats = {
    pending: ordersWithFood.filter(order => getOrderKitchenStatus(order) === "pending").length,
    preparing: ordersWithFood.filter(order => getOrderKitchenStatus(order) === "preparing").length,
    dispatched: dispatchedOrders.length,
    totalOrders: ordersWithFood.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Cocina</h2>
          <p className="text-muted-foreground">Comandas activas por mesa</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">⏳ Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">🔥 Preparando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">📦 Despachadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.dispatched}</div>
          </CardContent>
        </Card>
      </div>

      {/* Comandas Activas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Comandas en Proceso
        </h3>

        {ordersWithFood.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ChefHat className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">No hay comandas en proceso</p>
              <p className="text-sm">Las comandas pendientes y en preparación aparecerán aquí</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ordersWithFood.map((order) => {
              const foodItems = order.items.filter(item => item.category === "Comida");
              const timeElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
              const kitchenStatus = getOrderKitchenStatus(order);
              
              return (
                <Card 
                  key={order.tableId} 
                  className={cn(
                    "transition-all hover:shadow-lg border-2",
                    kitchenStatus === "preparing" && "border-blue-500/50 bg-blue-50",
                    kitchenStatus === "pending" && "border-yellow-500/50 bg-yellow-50"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">Mesa {order.tableNumber || "X"}</CardTitle>
                      <Badge 
                        className={cn(
                          "text-base px-3 py-1",
                          kitchenStatus === "preparing" && "bg-blue-500 text-white",
                          kitchenStatus === "pending" && "bg-yellow-500 text-white"
                        )}
                      >
                        {kitchenStatus === "pending" && "⏳ Pendiente"}
                        {kitchenStatus === "preparing" && "🔥 Preparando"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Hace {timeElapsed} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Platos de Comida:</p>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {foodItems.map((item) => (
                            <Card key={item.id} className="p-2 bg-white">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{item.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Cantidad: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">${item.total.toFixed(2)}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total platos:</span>
                        <span className="font-semibold">{foodItems.length}</span>
                      </div>
                      <div className="flex items-center justify-between bg-primary/10 p-2 rounded">
                        <span className="text-sm font-medium">Total comanda:</span>
                        <span className="font-bold text-primary flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {kitchenStatus === "pending" && (
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                          onClick={() => handleStartPreparing(order.tableId, order.tableNumber)}
                        >
                          <ChefHat className="mr-2 h-5 w-5" />
                          Iniciar Preparación
                        </Button>
                      )}

                      {kitchenStatus === "preparing" && (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                          onClick={() => handleMarkReady(order.tableId, order.tableNumber)}
                        >
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Marcar como Lista y Despachar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón flotante para comandas despachadas */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="lg"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-50 bg-green-600 hover:bg-green-700"
          >
            <div className="relative">
              <Package className="h-7 w-7" />
              {dispatchedOrders.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs"
                >
                  {dispatchedOrders.length}
                </Badge>
              )}
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <Package className="h-6 w-6 text-green-600" />
              Comandas Despachadas
            </SheetTitle>
            <SheetDescription>
              Comandas marcadas como listas hoy - {dispatchedOrders.length} total
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
            {dispatchedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">No hay comandas despachadas</p>
                <p className="text-sm text-center mt-2">
                  Las comandas que marques como listas aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dispatchedOrders.map((order) => {
                  const foodItems = order.items.filter((item: any) => item.category === "Comida");
                  
                  return (
                    <Card key={order.id} className="border-2 border-green-500/30 bg-green-50/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              Mesa {order.tableNumber || "X"}
                              <Badge className="bg-green-600">Despachada</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(order.dispatchedAt)}
                                </span>
                                <span className="text-muted-foreground">
                                  Hace {getTimeElapsed(order.dispatchedAt)}
                                </span>
                              </div>
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResumeOrder(order)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Retomar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Platos:</p>
                          <div className="space-y-2">
                            {foodItems.map((item: any) => (
                              <div 
                                key={item.id} 
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div>
                                  <p className="font-semibold text-sm">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Cant: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-bold text-primary">${item.total.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold text-primary flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            {order.total.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default KitchenView;