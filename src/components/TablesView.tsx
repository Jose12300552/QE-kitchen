// INSTRUCCIONES: Este archivo REEMPLAZA a src/components/TablesView.tsx
// El problema estaba en el formateo de fecha en el popup de asignar reservas

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Utensils, Plus, Minus, Trash2, DollarSign, ShoppingCart, X, Receipt, Edit, Users,
  Clock, Phone, ShoppingBag, Sparkles, AlertCircle, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useToast } from "@/hooks/use-toast";

interface Table {
  id: string;
  number: number | string;
  capacity: number;
  isDirectSale?: boolean;
}

const TablesView = () => {
  const { 
    inventory, 
    addItemToTable, 
    removeItemFromTable, 
    clearTableOrder, 
    tableOrders, 
    getTableTotal,
    markOrderReadyToPay,
    payOrder,
    getReservationByTable,
    reservations,
    assignTableToReservation,
    updateReservation
  } = useRestaurant();
  const { toast } = useToast();
  
  const [tables, setTables] = useState<Table[]>([
    { id: "x", number: "X", capacity: 0, isDirectSale: true },
    { id: "1", number: 1, capacity: 4 },
    { id: "2", number: 2, capacity: 2 },
    { id: "3", number: 3, capacity: 6 },
    { id: "4", number: 4, capacity: 4 },
    { id: "5", number: 5, capacity: 8 },
    { id: "6", number: 6, capacity: 2 },
    { id: "7", number: 7, capacity: 4 },
    { id: "8", number: 8, capacity: 6 },
    { id: "9", number: 9, capacity: 4 },
    { id: "10", number: 10, capacity: 2 },
    { id: "11", number: 11, capacity: 6 },
    { id: "12", number: 12, capacity: 4 },
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isComandaOpen, setIsComandaOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [isAssignReservationOpen, setIsAssignReservationOpen] = useState(false);
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [newTableForm, setNewTableForm] = useState({ number: "", capacity: "" });

  const categories = ["Todos", ...Array.from(new Set(inventory.map(item => item.category)))];

  const mesaX = tables.find(t => t.isDirectSale);
  const regularTables = tables.filter(t => !t.isDirectSale);

  const filteredInventory = selectedCategory === "Todos" 
    ? inventory 
    : inventory.filter(item => item.category === selectedCategory);

  // Función helper para formatear fechas de forma segura
  const formatReservationDate = (date: Date): string => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Fecha inválida";
      return d.toLocaleDateString('es-ES', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const openComanda = (table: Table) => {
    if (!table.isDirectSale && !getReservationByTable(table.id) && !tableOrders[table.id]) {
      const availableReservations = reservations.filter(r => 
        r.status === "pending" && 
        r.numberOfPeople <= table.capacity &&
        !r.tableNumber
      );
      
      if (availableReservations.length > 0) {
        setSelectedTable(table);
        setIsAssignReservationOpen(true);
        return;
      }
    }
    
    setSelectedTable(table);
    setIsComandaOpen(true);
    setQuantities({});
  };

  const handleAssignReservation = (reservationId: string) => {
    if (!selectedTable) return;
    
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    assignTableToReservation(reservationId, selectedTable.id, selectedTable.number);
    
    if (reservation.preOrder && reservation.preOrder.length > 0) {
      reservation.preOrder.forEach(item => {
        const inventoryItem = inventory.find(i => i.name === item.name);
        if (inventoryItem) {
          const tableNumber = typeof selectedTable.number === "number" ? selectedTable.number : 0;
          addItemToTable(selectedTable.id, tableNumber, inventoryItem, item.quantity);
        }
      });
      
      // Marcar como sentado después de cargar el pre-pedido
      updateReservation(reservationId, { status: "seated" });
      
      toast({
        title: "✅ Reserva asignada con pre-pedido",
        description: `Mesa ${selectedTable.number} asignada a ${reservation.customerName}. Pre-pedido cargado.`,
      });
    } else {
      toast({
        title: "✅ Reserva asignada",
        description: `Mesa ${selectedTable.number} asignada a ${reservation.customerName}`,
      });
    }
    
    setIsAssignReservationOpen(false);
    setIsComandaOpen(true);
  };

  const handleSkipReservation = () => {
    if (!selectedTable) return;
    setIsAssignReservationOpen(false);
    setIsComandaOpen(true);
  };

  const handleAddItem = (itemId: string) => {
    const quantity = quantities[itemId] || 1;
    const item = inventory.find(i => i.id === itemId);
    
    if (!item || !selectedTable) return;

    if (item.quantity < quantity) {
      toast({
        title: "⚠️ Stock insuficiente",
        description: `Solo quedan ${item.quantity} ${item.unit} de ${item.name}`,
        variant: "destructive",
      });
      return;
    }

    const tableNumber = typeof selectedTable.number === "number" ? selectedTable.number : 0;
    const success = addItemToTable(selectedTable.id, tableNumber, item, quantity);
    
    if (success) {
      toast({
        title: "✅ Producto agregado",
        description: `${quantity} x ${item.name} agregado a Mesa ${selectedTable.number}`,
      });
      setQuantities({ ...quantities, [itemId]: 1 });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedTable) return;
    removeItemFromTable(selectedTable.id, itemId);
    toast({
      title: "🗑️ Producto eliminado",
      description: "El producto ha sido eliminado de la comanda",
    });
  };

  const handleMarkReadyToPay = () => {
    if (!selectedTable) return;
    
    const order = tableOrders[selectedTable.id];
    if (!order || order.items.length === 0) {
      toast({
        title: "⚠️ Comanda vacía",
        description: "Agrega productos antes de marcar como por cobrar",
        variant: "destructive",
      });
      return;
    }

    markOrderReadyToPay(selectedTable.id);
    toast({
      title: "✅ Mesa marcada",
      description: `Mesa ${selectedTable.number} está lista para cobrar - Total: $${order.total.toFixed(2)}`,
    });
    setIsComandaOpen(false);
    setSelectedTable(null);
  };

  const handlePayOrder = () => {
    if (!selectedTable) return;
    
    const order = tableOrders[selectedTable.id];
    if (!order) return;

    payOrder(selectedTable.id);
    
    if (selectedTable.isDirectSale) {
      toast({
        title: "✅ Venta directa completada",
        description: `Total: $${order.total.toFixed(2)}`,
      });
    } else {
      toast({
        title: "✅ Pago completado",
        description: `Mesa ${selectedTable.number} pagada - Total: $${order.total.toFixed(2)}`,
      });
    }
    
    setIsConfirmPaymentOpen(false);
    setIsComandaOpen(false);
    setSelectedTable(null);
  };

  const handleRequestPayment = () => {
    if (!selectedTable) return;
    
    const order = tableOrders[selectedTable.id];
    if (!order || order.items.length === 0) {
      toast({
        title: "⚠️ Comanda vacía",
        description: "Agrega productos antes de cobrar",
        variant: "destructive",
      });
      return;
    }

    // Abrir diálogo de confirmación
    setIsConfirmPaymentOpen(true);
  };

  const handleCancelOrder = () => {
    if (!selectedTable) return;
    
    const order = tableOrders[selectedTable.id];
    if (order && order.items.length > 0) {
      if (confirm("¿Estás seguro de cancelar esta comanda? Los productos volverán al inventario.")) {
        clearTableOrder(selectedTable.id);
        toast({
          title: "❌ Comanda cancelada",
          description: "Los productos han sido devueltos al inventario",
        });
        setIsComandaOpen(false);
        setSelectedTable(null);
      }
    } else {
      setIsComandaOpen(false);
      setSelectedTable(null);
    }
  };

  const handleAddTable = () => {
    if (!newTableForm.number || !newTableForm.capacity) {
      toast({
        title: "⚠️ Error",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const newTable: Table = {
      id: Date.now().toString(),
      number: parseInt(newTableForm.number),
      capacity: parseInt(newTableForm.capacity),
    };

    setTables([...tables, newTable]);
    setNewTableForm({ number: "", capacity: "" });
    setIsAddTableOpen(false);
    toast({
      title: "✅ Mesa agregada",
      description: `Mesa ${newTable.number} agregada exitosamente`,
    });
  };

  const handleEditTable = () => {
    if (!editingTable) return;

    setTables(tables.map(t => t.id === editingTable.id ? editingTable : t));
    setIsEditTableOpen(false);
    setEditingTable(null);
    toast({
      title: "✅ Mesa actualizada",
      description: "Los cambios han sido guardados",
    });
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table?.isDirectSale) {
      toast({
        title: "⚠️ No se puede eliminar",
        description: "La Mesa X no se puede eliminar",
        variant: "destructive",
      });
      return;
    }

    if (tableOrders[tableId]) {
      toast({
        title: "⚠️ No se puede eliminar",
        description: "La mesa tiene pedidos activos",
        variant: "destructive",
      });
      return;
    }

    if (confirm("¿Estás seguro de eliminar esta mesa?")) {
      setTables(tables.filter(t => t.id !== tableId));
      toast({
        title: "✅ Mesa eliminada",
        description: "La mesa ha sido eliminada",
      });
    }
  };

  const getTableStatus = (table: Table) => {
    const order = tableOrders[table.id];
    const reservation = getReservationByTable(table.id);
    
    if (!order && reservation) return "reservada";
    if (!order) return "libre";
    if (order.status === "ready_to_pay") return "por_cobrar";
    return "ocupada";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "libre":
        return {
          label: "Libre",
          className: "bg-success/10 border-success/20",
          badgeVariant: "outline" as const,
          badgeClass: "border-success text-success",
        };
      case "ocupada":
        return {
          label: "Ocupada",
          className: "bg-warning/10 border-warning/20",
          badgeVariant: "secondary" as const,
          badgeClass: "bg-warning text-warning-foreground",
        };
      case "por_cobrar":
        return {
          label: "Por Cobrar",
          className: "bg-destructive/10 border-destructive/20",
          badgeVariant: "destructive" as const,
          badgeClass: "bg-destructive text-destructive-foreground",
        };
      case "reservada":
        return {
          label: "Reservada",
          className: "bg-blue-500/10 border-blue-500/20",
          badgeVariant: "outline" as const,
          badgeClass: "border-blue-500 text-blue-600",
        };
      default:
        return {
          label: "Libre",
          className: "",
          badgeVariant: "outline" as const,
          badgeClass: "",
        };
    }
  };

  const tableStats = {
    libre: regularTables.filter(t => getTableStatus(t) === "libre").length,
    ocupada: regularTables.filter(t => getTableStatus(t) === "ocupada").length,
    por_cobrar: regularTables.filter(t => getTableStatus(t) === "por_cobrar").length,
    reservada: regularTables.filter(t => getTableStatus(t) === "reservada").length,
  };

  const mesaXStats = mesaX ? {
    totalDia: getTableTotal(mesaX.id),
    pedidosActivos: tableOrders[mesaX.id]?.items.length || 0,
    estado: getTableStatus(mesaX)
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">🍽️ Sistema de Mesas</h2>
          <p className="text-muted-foreground">Gestión de mesas del restaurante</p>
        </div>
        <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
          <Button onClick={() => setIsAddTableOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Mesa
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Número de Mesa</Label>
                <Input
                  type="number"
                  value={newTableForm.number}
                  onChange={(e) => setNewTableForm({ ...newTableForm, number: e.target.value })}
                  placeholder="Ej: 9"
                />
              </div>
              <div>
                <Label>Capacidad (personas)</Label>
                <Input
                  type="number"
                  value={newTableForm.capacity}
                  onChange={(e) => setNewTableForm({ ...newTableForm, capacity: e.target.value })}
                  placeholder="Ej: 4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTable}>Agregar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mesa X */}
      {mesaX && (
        <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    Mesa X - Venta Directa
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Pedidos para llevar, delivery y ventas sin mesa asignada
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground px-4 py-2 text-lg">
                {getStatusConfig(getTableStatus(mesaX)).label.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Venta Actual:</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  ${mesaXStats?.totalDia.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Productos:</span>
                </div>
                <span className="text-2xl font-bold">{mesaXStats?.pedidosActivos || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Estado:</span>
                </div>
                <Badge className={getStatusConfig(mesaXStats?.estado || "libre").badgeClass}>
                  {getStatusConfig(mesaXStats?.estado || "libre").label}
                </Badge>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => openComanda(mesaX)}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Abrir Venta Directa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mesas Libres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{tableStats.libre}</div>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{tableStats.ocupada}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{tableStats.por_cobrar}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reservadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{tableStats.reservada}</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Mesas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mesas del Restaurante
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Click en una mesa para gestionar pedidos</span>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {regularTables.map((table) => {
            const tableStatus = getTableStatus(table);
            const statusConfig = getStatusConfig(tableStatus);
            const tableTotal = getTableTotal(table.id);
            const reservation = getReservationByTable(table.id);
            
            return (
              <Card 
                key={table.id} 
                className={cn(
                  "transition-all hover:shadow-lg cursor-pointer border-2 hover:scale-105 transform duration-200",
                  statusConfig.className,
                  reservation && "ring-2 ring-blue-500/20"
                )}
                onClick={() => openComanda(table)}
              >
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Mesa {table.number}
                    </CardTitle>
                    <Badge variant={statusConfig.badgeVariant} className={cn("text-xs", statusConfig.badgeClass)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <Utensils className="inline h-3 w-3 mr-1" />
                    {table.capacity} personas
                  </CardDescription>
                </CardHeader>
                
                {reservation && (
                  <CardContent className="pt-1 pb-2 px-3 border-t">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-blue-600">
                        {reservation.customerName}
                      </p>
                      {reservation.time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {reservation.time}
                        </div>
                      )}
                      {reservation.preOrder && reservation.preOrder.length > 0 && (
                        <Badge variant="outline" className="text-xs w-full justify-center">
                          Pre-pedido: {reservation.preOrder.length} items
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                )}
                
                {tableTotal > 0 && (
                  <CardContent className="pt-1 pb-2 px-3 border-t">
                    <div className="flex items-center justify-between bg-primary/10 p-1.5 rounded">
                      <span className="text-xs font-medium">Total:</span>
                      <span className="text-sm font-bold text-primary">${tableTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                )}
                
                {!reservation && !tableOrders[table.id] && (
                  <CardContent className="pt-1 pb-2 px-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setIsAssignReservationOpen(true);
                      }}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Asignar Reserva
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dialog Comanda */}
      <Dialog open={isComandaOpen} onOpenChange={setIsComandaOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Comanda - Mesa {selectedTable?.number}
              {selectedTable?.isDirectSale && (
                <Badge variant="secondary" className="bg-purple-500 text-white">Venta Directa</Badge>
              )}
              {selectedTable && tableOrders[selectedTable.id]?.status === "ready_to_pay" && (
                <Badge variant="destructive">Por Cobrar</Badge>
              )}
              {selectedTable && getReservationByTable(selectedTable.id) && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  {getReservationByTable(selectedTable.id)?.customerName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
            {/* Panel Izquierdo - Productos */}
            <div className="space-y-4">
              <div>
                <Label>Categorías</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredInventory.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Stock: {item.quantity} {item.unit}
                          </p>
                          <p className="text-lg font-bold text-primary mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const current = quantities[item.id] || 1;
                                if (current > 1) {
                                  setQuantities({ ...quantities, [item.id]: current - 1 });
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={quantities[item.id] || 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setQuantities({ ...quantities, [item.id]: Math.max(1, value) });
                              }}
                              className="h-8 w-16 text-center border-0 p-0"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const current = quantities[item.id] || 1;
                                setQuantities({ ...quantities, [item.id]: current + 1 });
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddItem(item.id)}
                            disabled={item.quantity === 0}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Panel Derecho - Comanda */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Comanda Actual</Label>
                {selectedTable && tableOrders[selectedTable.id]?.items.length > 0 && (
                  <Badge variant="secondary">
                    {tableOrders[selectedTable.id].items.length} productos
                  </Badge>
                )}
              </div>

              <Separator />

              <ScrollArea className="h-[300px]">
                {selectedTable && tableOrders[selectedTable.id]?.items.length > 0 ? (
                  <div className="space-y-2">
                    {tableOrders[selectedTable.id].items.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x ${item.price.toFixed(2)}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              ${item.total.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay productos en la comanda</p>
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Total */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-primary">
                    ${selectedTable ? getTableTotal(selectedTable.id).toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelOrder}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {selectedTable?.isDirectSale ? (
              <Button 
                onClick={handleRequestPayment}
                disabled={!selectedTable || !tableOrders[selectedTable.id] || tableOrders[selectedTable.id].items.length === 0}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Cobrar Venta
              </Button>
            ) : selectedTable && tableOrders[selectedTable.id]?.status === "ready_to_pay" ? (
              <Button onClick={handleRequestPayment}>
                <DollarSign className="h-4 w-4 mr-2" />
                Cobrar Mesa
              </Button>
            ) : (
              <Button 
                onClick={handleMarkReadyToPay} 
                disabled={!selectedTable || !tableOrders[selectedTable.id] || tableOrders[selectedTable.id].items.length === 0}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Marcar Por Cobrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Asignar Reserva */}
      <Dialog open={isAssignReservationOpen} onOpenChange={setIsAssignReservationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Asignar Reserva a Mesa {selectedTable?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona una reserva para asignar a esta mesa. Las reservas con pre-pedido cargarán automáticamente los productos.
            </p>

            <Separator />

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {reservations
                  .filter(r => 
                    r.status === "pending" && 
                    selectedTable && 
                    r.numberOfPeople <= selectedTable.capacity &&
                    !r.tableNumber
                  )
                  .map((reservation) => (
                    <Card 
                      key={reservation.id}
                      className="p-4 cursor-pointer hover:bg-primary/5 transition-colors border-2 hover:border-primary/50"
                      onClick={() => handleAssignReservation(reservation.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">👤 {reservation.customerName}</h4>
                            <Badge variant="secondary">
                              {reservation.status === "pending" ? "Pendiente" : "Confirmada"}
                            </Badge>
                          </div>
                          <Badge variant="outline">
                            {reservation.numberOfPeople} personas
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatReservationDate(reservation.date)}
                          </div>
                          {reservation.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {reservation.time}
                            </div>
                          )}
                          {reservation.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {reservation.phoneNumber}
                            </div>
                          )}
                        </div>
                        
                        {reservation.preOrder && reservation.preOrder.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                Pre-pedido:
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {reservation.preOrder.length} productos - 
                                ${reservation.preOrder.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {reservation.notes && (
                          <p className="text-xs bg-muted p-2 rounded">
                            📝 Notas: {reservation.notes}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                  
                {reservations.filter(r => 
                  r.status === "pending" && 
                  selectedTable && 
                  r.numberOfPeople <= selectedTable.capacity &&
                  !r.tableNumber
                ).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay reservas disponibles para esta mesa</p>
                    <p className="text-sm mt-2">Las reservas deben tener capacidad menor o igual a {selectedTable?.capacity} personas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipReservation}>
              Continuar sin Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmación de Pago */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Confirmar Cobro
            </DialogTitle>
          </DialogHeader>
          
          {selectedTable && tableOrders[selectedTable.id] && (
            <div className="space-y-4">
              {/* Información de la mesa */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">
                    {selectedTable.isDirectSale ? "Venta Directa" : `Mesa ${selectedTable.number}`}
                  </span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    ${tableOrders[selectedTable.id].total.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Lista de productos */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Productos:
                </h4>
                <ScrollArea className="max-h-[300px] pr-2">
                  <div className="space-y-2">
                    {tableOrders[selectedTable.id].items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-bold text-primary">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Total */}
              <div className="bg-primary/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">TOTAL A COBRAR:</span>
                  <span className="text-3xl font-bold text-primary">
                    ${tableOrders[selectedTable.id].total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pregunta de confirmación */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-center font-medium text-yellow-900">
                  ¿Está seguro de proceder con el cobro?
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmPaymentOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePayOrder}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TablesView;
