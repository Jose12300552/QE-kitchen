import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarDays, Plus, Edit, Trash2, Users, Phone, Clock, 
  CheckCircle2, XCircle, Utensils, MapPin, ShoppingCart, Minus,
  AlertCircle, Info
} from "lucide-react";
import { useRestaurant, Reservation } from "@/contexts/RestaurantContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Table {
  id: string;
  number: number | string;
  capacity: number;
  isDirectSale?: boolean;
}

const ReservationsView = () => {
  const { 
    reservations, 
    addReservation, 
    updateReservation, 
    deleteReservation,
    inventory,
    addPreOrderToReservation,
    removePreOrderItem,
  } = useRestaurant();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreOrderOpen, setIsPreOrderOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    numberOfPeople: "",
    date: "",
    time: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      customerName: "",
      phoneNumber: "",
      numberOfPeople: "",
      date: "",
      time: "",
      notes: "",
    });
  };

  const handleAdd = () => {
    // Solo el nombre del cliente es obligatorio
    if (!formData.customerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    // Valores por defecto para campos opcionales
    const numberOfPeople = formData.numberOfPeople ? parseInt(formData.numberOfPeople) : 2;
    const date = formData.date ? new Date(formData.date) : new Date();
    const time = formData.time || "";
    const phoneNumber = formData.phoneNumber || "";

    addReservation({
      customerName: formData.customerName,
      phoneNumber: phoneNumber,
      numberOfPeople: numberOfPeople,
      date: date,
      time: time,
      notes: formData.notes,
    });

    toast({
      title: "✅ Reserva creada",
      description: `Reserva de ${formData.customerName} creada exitosamente`,
    });

    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = () => {
    if (!editingReservation) return;

    // Solo el nombre es obligatorio al editar
    if (!formData.customerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const numberOfPeople = formData.numberOfPeople ? parseInt(formData.numberOfPeople) : 2;
    const date = formData.date ? new Date(formData.date) : new Date();
    const time = formData.time || "";
    const phoneNumber = formData.phoneNumber || "";

    updateReservation(editingReservation.id, {
      customerName: formData.customerName,
      phoneNumber: phoneNumber,
      numberOfPeople: numberOfPeople,
      date: date,
      time: time,
      notes: formData.notes,
    });

    toast({
      title: "✅ Reserva actualizada",
      description: "Los cambios han sido guardados",
    });

    resetForm();
    setIsEditOpen(false);
    setEditingReservation(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta reserva?")) {
      deleteReservation(id);
      toast({
        title: "🗑️ Reserva eliminada",
        description: "La reserva ha sido eliminada",
      });
    }
  };

  const categories = ["Todos", ...Array.from(new Set(inventory.map(item => item.category)))];

  const filteredInventory = selectedCategory === "Todos" 
    ? inventory 
    : inventory.filter(item => item.category === selectedCategory);

  const handleAddPreOrderItem = (itemId: string) => {
    if (!selectedReservation) return;
    
    const quantity = quantities[itemId] || 1;
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) return;

    const success = addPreOrderToReservation(selectedReservation.id, item, quantity);
    
    if (success) {
      toast({
        title: "✅ Producto agregado al pre-pedido",
        description: `${quantity} x ${item.name}`,
      });
      setQuantities({ ...quantities, [itemId]: 1 });
    }
  };

  const handleRemovePreOrderItem = (itemId: string) => {
    if (!selectedReservation) return;
    removePreOrderItem(selectedReservation.id, itemId);
    toast({
      title: "🗑️ Producto eliminado",
      description: "El producto ha sido eliminado del pre-pedido",
    });
  };

  const openPreOrderDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsPreOrderOpen(true);
    setQuantities({});
  };

  const getPreOrderTotal = (reservation: Reservation) => {
    if (!reservation.preOrder) return 0;
    return reservation.preOrder.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCancelReservation = (id: string) => {
    if (confirm("¿Estás seguro de cancelar esta reserva?")) {
      updateReservation(id, { status: "cancelled" });
      toast({
        title: "❌ Reserva cancelada",
        description: "La reserva ha sido cancelada",
      });
    }
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customerName: reservation.customerName,
      phoneNumber: reservation.phoneNumber || "",
      numberOfPeople: reservation.numberOfPeople.toString(),
      date: new Date(reservation.date).toISOString().split('T')[0],
      time: reservation.time || "",
      notes: reservation.notes || "",
    });
    setIsEditOpen(true);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendiente",
          variant: "outline" as const,
          className: "border-yellow-500 text-yellow-700 bg-yellow-50",
        };
      case "confirmed":
        return {
          label: "Confirmada",
          variant: "secondary" as const,
          className: "bg-blue-500 text-white",
        };
      case "seated":
        return {
          label: "Sentado",
          variant: "default" as const,
          className: "bg-green-500 text-white",
        };
      case "completed":
        return {
          label: "Completada",
          variant: "outline" as const,
          className: "border-gray-500 text-gray-700 bg-gray-50",
        };
      case "cancelled":
        return {
          label: "Cancelada",
          variant: "destructive" as const,
          className: "",
        };
      default:
        return {
          label: "Pendiente",
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const stats = {
    pending: reservations.filter(r => r.status === "pending").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    seated: reservations.filter(r => r.status === "seated").length,
    total: reservations.filter(r => r.status !== "cancelled" && r.status !== "completed").length,
  };

  // Filtrar solo reservas pendientes (las que están esperando ser asignadas)
  const pendingReservations = reservations.filter(r => 
    r.status === "pending"
  );

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const resDate = new Date(reservationDate);
    resDate.setHours(0, 0, 0, 0);
    
    if (resDate.getTime() === today.getTime()) {
      return "Hoy";
    }
    
    return reservationDate.toLocaleDateString('es-ES', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">📋 Sistema de Reservas</h2>
          <p className="text-muted-foreground">Gestión de reservas de platos</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">⏳ Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Sin mesa asignada</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">✓ Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">Con mesa asignada</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">🍽️ En Mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.seated}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes sentados</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta informativa */}
      <Alert className="border-blue-500/50 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Flujo de trabajo:</strong> Las reservas se crean aquí con el nombre del cliente y los platos reservados. 
          Luego, desde la pestaña <strong>MESAS</strong>, se asignan a una mesa específica cuando el cliente llega.
        </AlertDescription>
      </Alert>

      {/* Lista de Reservas Pendientes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-yellow-600" />
          Reservas Pendientes de Asignar
        </h3>

        {pendingReservations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarDays className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">No hay reservas pendientes</p>
              <p className="text-sm text-center max-w-md mt-2">
                Las nuevas reservas aparecerán aquí hasta que sean asignadas a una mesa desde la pestaña MESAS
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingReservations.map((reservation) => {
              const statusConfig = getStatusConfig(reservation.status);
              
              return (
                <Card 
                  key={reservation.id}
                  className="transition-all hover:shadow-lg border-yellow-500/30 bg-yellow-50/50"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">👤 {reservation.customerName}</CardTitle>
                      <Badge 
                        variant={statusConfig.variant}
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatDate(reservation.date)}
                      {reservation.time && ` - ${reservation.time}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.numberOfPeople} personas</span>
                      </div>
                      {reservation.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.phoneNumber}</span>
                        </div>
                      )}
                      {reservation.preOrder && reservation.preOrder.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">
                            Pre-pedido: ${getPreOrderTotal(reservation).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {reservation.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Notas:</strong> {reservation.notes}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Nota informativa */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                      <strong>💡 Para asignar mesa:</strong> Ve a la pestaña MESAS y haz click en "Asignar Reserva"
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openPreOrderDialog(reservation)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {reservation.preOrder && reservation.preOrder.length > 0 ? "Editar" : "Agregar"} Platos
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(reservation)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDelete(reservation.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Separador visual */}
      <Separator className="my-8" />

      {/* Reservas Confirmadas y En Mesa */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Utensils className="h-5 w-5 text-blue-600" />
          Reservas Activas (Con Mesa Asignada)
        </h3>

        {reservations.filter(r => r.status === "confirmed" || r.status === "seated").length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay reservas activas con mesa asignada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reservations
              .filter(r => r.status === "confirmed" || r.status === "seated")
              .map((reservation) => {
                const statusConfig = getStatusConfig(reservation.status);
                
                return (
                  <Card 
                    key={reservation.id}
                    className={cn(
                      "transition-all hover:shadow-lg",
                      reservation.status === "seated" && "border-green-500/50 bg-green-500/5",
                      reservation.status === "confirmed" && "border-blue-500/50 bg-blue-500/5"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">👤 {reservation.customerName}</CardTitle>
                        <Badge 
                          variant={statusConfig.variant}
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {formatDate(reservation.date)}
                        {reservation.time && ` - ${reservation.time}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.numberOfPeople} personas</span>
                        </div>
                        {reservation.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.phoneNumber}</span>
                          </div>
                        )}
                        {reservation.tableNumber && (
                          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                            <Utensils className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">Mesa {reservation.tableNumber}</span>
                          </div>
                        )}
                        {reservation.preOrder && reservation.preOrder.length > 0 && (
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              Pre-pedido: ${getPreOrderTotal(reservation).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {reservation.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Notas:</strong> {reservation.notes}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(reservation)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Dialog Agregar Reserva */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva de Platos</DialogTitle>
          </DialogHeader>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Solo necesitas el <strong>nombre del cliente</strong> para crear la reserva. 
              Los platos se agregan después, y la mesa se asigna cuando el cliente llegue.
            </AlertDescription>
          </Alert>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label>
                  Nombre del Cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <Label>
                  Teléfono <span className="text-muted-foreground text-xs">(Opcional)</span>
                </Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="77123456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Número de Personas <span className="text-muted-foreground text-xs">(Opcional)</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.numberOfPeople}
                    onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label>
                    Hora <span className="text-muted-foreground text-xs">(Opcional)</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Fecha <span className="text-muted-foreground text-xs">(Opcional - Por defecto hoy)</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>
                  Notas <span className="text-muted-foreground text-xs">(Opcional)</span>
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Alergias, preferencias especiales..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={handleAdd}>Crear Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Reserva */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label>
                  Nombre del Cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>
                  Teléfono <span className="text-muted-foreground text-xs">(Opcional)</span>
                </Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="77123456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Número de Personas <span className="text-muted-foreground text-xs">(Opcional)</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.numberOfPeople}
                    onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label>
                    Hora <span className="text-muted-foreground text-xs">(Opcional)</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Fecha <span className="text-muted-foreground text-xs">(Opcional)</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>
                  Notas <span className="text-muted-foreground text-xs">(Opcional)</span>
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={handleEdit}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pre-Pedido */}
      <Dialog open={isPreOrderOpen} onOpenChange={setIsPreOrderOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Reserva de Platos - {selectedReservation?.customerName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
            {/* Panel Izquierdo - Productos Disponibles */}
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
                            onClick={() => handleAddPreOrderItem(item.id)}
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

            {/* Panel Derecho - Platos Reservados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Platos Reservados</Label>
                {selectedReservation?.preOrder && selectedReservation.preOrder.length > 0 && (
                  <Badge variant="secondary">
                    {selectedReservation.preOrder.length} platos
                  </Badge>
                )}
              </div>

              <Separator />

              <ScrollArea className="h-[300px]">
                {selectedReservation?.preOrder && selectedReservation.preOrder.length > 0 ? (
                  <div className="space-y-2">
                    {selectedReservation.preOrder.map((item) => (
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
                            onClick={() => handleRemovePreOrderItem(item.id)}
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
                    <p>No hay platos reservados</p>
                    <p className="text-sm text-center mt-2">
                      Agrega los platos que el cliente quiere reservar
                    </p>
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Total */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-primary">
                    ${selectedReservation ? getPreOrderTotal(selectedReservation).toFixed(2) : "0.00"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * Los platos se prepararán cuando el cliente sea asignado a una mesa
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsPreOrderOpen(false);
              setSelectedReservation(null);
              toast({
                title: "✅ Platos guardados",
                description: "Los platos reservados han sido guardados",
              });
            }}>
              Guardar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationsView;