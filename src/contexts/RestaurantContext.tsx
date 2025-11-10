import React, { createContext, useContext, useState, ReactNode } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  category: string;
  price: number;
}

export interface OrderItem {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category: string;
  kitchenStatus?: "pending" | "preparing" | "ready";
}

export interface TableOrder {
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: "active" | "ready_to_pay" | "paid";
}

export interface OrderHistory {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  paidAt: Date;
}

export interface Reservation {
  id: string;
  customerName: string;
  phoneNumber: string;
  numberOfPeople: number;
  date: Date;
  time: string;
  tableId?: string;
  tableNumber?: number | string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled";
  notes?: string;
  preOrder?: OrderItem[];
}

// Tipo para comandas despachadas
export interface DispatchedOrder {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  dispatchedAt: Date;
}

interface RestaurantContextType {
  inventory: InventoryItem[];
  updateInventory: (items: InventoryItem[]) => void;
  decreaseInventory: (itemId: string, quantity: number) => boolean;
  tableOrders: { [tableId: string]: TableOrder };
  addItemToTable: (tableId: string, tableNumber: number, item: InventoryItem, quantity: number) => boolean;
  removeItemFromTable: (tableId: string, itemId: string) => void;
  clearTableOrder: (tableId: string) => void;
  getTableTotal: (tableId: string) => number;
  markOrderReadyToPay: (tableId: string) => void;
  payOrder: (tableId: string) => void;
  orderHistory: OrderHistory[];
  updateKitchenItemStatus: (tableId: string, itemId: string, status: "pending" | "preparing" | "ready") => void;
  updateOrderKitchenStatus: (tableId: string, status: "pending" | "preparing" | "ready") => void;
  dispatchedOrders: DispatchedOrder[];
  resumeDispatchedOrder: (dispatchedOrderId: string) => void;
  reservations: Reservation[];
  addReservation: (reservation: Omit<Reservation, "id" | "status">) => void;
  updateReservation: (id: string, reservation: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  assignTableToReservation: (reservationId: string, tableId: string, tableNumber: number | string) => void;
  getReservationByTable: (tableId: string) => Reservation | undefined;
  addPreOrderToReservation: (reservationId: string, item: InventoryItem, quantity: number) => boolean;
  removePreOrderItem: (reservationId: string, itemId: string) => void;
  activateReservationOrder: (reservationId: string) => boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "1", name: "Hamburguesa", quantity: 50, unit: "unidades", minStock: 10, category: "Comida", price: 12.50 },
    { id: "2", name: "Pizza", quantity: 30, unit: "unidades", minStock: 5, category: "Comida", price: 15.00 },
    { id: "3", name: "Ensalada", quantity: 40, unit: "unidades", minStock: 8, category: "Comida", price: 8.00 },
    { id: "4", name: "Papas Fritas", quantity: 60, unit: "unidades", minStock: 15, category: "Acompañamiento", price: 5.00 },
    { id: "5", name: "Coca Cola", quantity: 100, unit: "unidades", minStock: 20, category: "Bebidas", price: 3.50 },
    { id: "6", name: "Agua", quantity: 80, unit: "unidades", minStock: 15, category: "Bebidas", price: 2.00 },
    { id: "7", name: "Cerveza", quantity: 60, unit: "unidades", minStock: 10, category: "Bebidas", price: 5.50 },
    { id: "8", name: "Pasta", quantity: 35, unit: "unidades", minStock: 8, category: "Comida", price: 13.00 },
    { id: "9", name: "Sushi", quantity: 25, unit: "unidades", minStock: 5, category: "Comida", price: 18.00 },
  ]);

  const [tableOrders, setTableOrders] = useState<{ [tableId: string]: TableOrder }>({});
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dispatchedOrders, setDispatchedOrders] = useState<DispatchedOrder[]>([]);
  

  const updateInventory = (items: InventoryItem[]) => {
    setInventory(items);
  };

  const decreaseInventory = (itemId: string, quantity: number): boolean => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item || item.quantity < quantity) {
      return false;
    }

    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i))
    );
    return true;
  };

  const addItemToTable = (tableId: string, tableNumber: number, item: InventoryItem, quantity: number): boolean => {
    if (item.quantity < quantity) {
      return false;
    }

    if (!decreaseInventory(item.id, quantity)) {
      return false;
    }

    setTableOrders((prev) => {
      const currentOrder = prev[tableId] || {
        tableId,
        tableNumber,
        items: [],
        total: 0,
        createdAt: new Date(),
        status: "active" as const,
      };

      const existingItemIndex = currentOrder.items.findIndex(
        (orderItem) => orderItem.inventoryItemId === item.id
      );

      let newItems: OrderItem[];
      if (existingItemIndex >= 0) {
        newItems = currentOrder.items.map((orderItem, index) =>
          index === existingItemIndex
            ? {
                ...orderItem,
                quantity: orderItem.quantity + quantity,
                total: (orderItem.quantity + quantity) * item.price,
              }
            : orderItem
        );
      } else {
        const newOrderItem: OrderItem = {
          id: `${tableId}-${item.id}-${Date.now()}`,
          inventoryItemId: item.id,
          name: item.name,
          quantity,
          price: item.price,
          total: item.price * quantity,
          category: item.category,
          kitchenStatus: item.category === "Comida" ? "pending" : undefined,
        };
        newItems = [...currentOrder.items, newOrderItem];
      }

      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

      return {
        ...prev,
        [tableId]: {
          ...currentOrder,
          items: newItems,
          total: newTotal,
        },
      };
    });

    return true;
  };

  const removeItemFromTable = (tableId: string, itemId: string) => {
    setTableOrders((prev) => {
      const currentOrder = prev[tableId];
      if (!currentOrder) return prev;

      const itemToRemove = currentOrder.items.find((item) => item.id === itemId);
      if (!itemToRemove) return prev;

      setInventory((prevInventory) =>
        prevInventory.map((invItem) =>
          invItem.id === itemToRemove.inventoryItemId
            ? { ...invItem, quantity: invItem.quantity + itemToRemove.quantity }
            : invItem
        )
      );

      const newItems = currentOrder.items.filter((item) => item.id !== itemId);
      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);

      if (newItems.length === 0) {
        const { [tableId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [tableId]: {
          ...currentOrder,
          items: newItems,
          total: newTotal,
        },
      };
    });
  };

  const clearTableOrder = (tableId: string) => {
    const order = tableOrders[tableId];
    if (order) {
      order.items.forEach((item) => {
        setInventory((prev) =>
          prev.map((invItem) =>
            invItem.id === item.inventoryItemId
              ? { ...invItem, quantity: invItem.quantity + item.quantity }
              : invItem
          )
        );
      });
    }

    setTableOrders((prev) => {
      const { [tableId]: _, ...rest } = prev;
      return rest;
    });
  };

  const markOrderReadyToPay = (tableId: string) => {
    setTableOrders((prev) => {
      const currentOrder = prev[tableId];
      if (!currentOrder) return prev;

      return {
        ...prev,
        [tableId]: {
          ...currentOrder,
          status: "ready_to_pay",
        },
      };
    });
  };

  const payOrder = (tableId: string) => {
    const order = tableOrders[tableId];
    if (!order) return;

    const historyEntry: OrderHistory = {
      id: Date.now().toString(),
      tableNumber: order.tableNumber,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
      paidAt: new Date(),
    };

    setOrderHistory((prev) => [historyEntry, ...prev]);

    // Eliminar de despachadas si estaba ahí
    setDispatchedOrders((prev) => prev.filter(d => d.tableId !== tableId));

    setTableOrders((prev) => {
      const { [tableId]: _, ...rest } = prev;
      return rest;
    });

    setReservations((prev) =>
      prev.map((res) =>
        res.tableId === tableId && res.status === "seated"
          ? { ...res, status: "completed" }
          : res
      )
    );
  };

  const updateKitchenItemStatus = (tableId: string, itemId: string, status: "pending" | "preparing" | "ready") => {
    setTableOrders((prev) => {
      const currentOrder = prev[tableId];
      if (!currentOrder) return prev;

      const updatedItems = currentOrder.items.map((item) =>
        item.id === itemId ? { ...item, kitchenStatus: status } : item
      );

      return {
        ...prev,
        [tableId]: {
          ...currentOrder,
          items: updatedItems,
        },
      };
    });
  };

  // Actualizar el estado de toda la comanda
  const updateOrderKitchenStatus = (tableId: string, status: "pending" | "preparing" | "ready") => {
    const currentOrder = tableOrders[tableId];
    if (!currentOrder) return;

    // Si se marca como "ready", despachar la comanda
    if (status === "ready") {
      const dispatchedOrder: DispatchedOrder = {
        id: Date.now().toString(),
        tableId: currentOrder.tableId,
        tableNumber: currentOrder.tableNumber,
        items: currentOrder.items.map(item => ({...item})),
        total: currentOrder.total,
        createdAt: currentOrder.createdAt,
        dispatchedAt: new Date(),
      };

      setDispatchedOrders((prev) => [dispatchedOrder, ...prev]);

      // Mantener la orden en tableOrders pero marcar items como ready
      setTableOrders((prev) => {
        const updatedItems = currentOrder.items.map((item) =>
          item.category === "Comida" ? { ...item, kitchenStatus: status } : item
        );

        return {
          ...prev,
          [tableId]: {
            ...currentOrder,
            items: updatedItems,
          },
        };
      });
    } else {
      // Para "pending" o "preparing", solo actualizar el estado
      setTableOrders((prev) => {
        const updatedItems = currentOrder.items.map((item) =>
          item.category === "Comida" ? { ...item, kitchenStatus: status } : item
        );

        return {
          ...prev,
          [tableId]: {
            ...currentOrder,
            items: updatedItems,
          },
        };
      });
    }
  };

  // Retomar una comanda despachada
  const resumeDispatchedOrder = (dispatchedOrderId: string) => {
    const dispatchedOrder = dispatchedOrders.find(d => d.id === dispatchedOrderId);
    if (!dispatchedOrder) return;

    // Actualizar el estado de los items de comida a "preparing"
    setTableOrders((prev) => {
      const currentOrder = prev[dispatchedOrder.tableId];
      if (!currentOrder) return prev;

      const updatedItems = currentOrder.items.map((item) =>
        item.category === "Comida" ? { ...item, kitchenStatus: "preparing" as const } : item
      );

      return {
        ...prev,
        [dispatchedOrder.tableId]: {
          ...currentOrder,
          items: updatedItems,
        },
      };
    });

    // Eliminar de la lista de despachadas
    setDispatchedOrders((prev) => prev.filter(d => d.id !== dispatchedOrderId));
  };

  const getTableTotal = (tableId: string): number => {
    return tableOrders[tableId]?.total || 0;
  };

  const addReservation = (reservation: Omit<Reservation, "id" | "status">) => {
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
      status: "pending",
    };
    setReservations((prev) => [...prev, newReservation]);
  };

  const updateReservation = (id: string, updates: Partial<Reservation>) => {
    setReservations((prev) =>
      prev.map((res) => (res.id === id ? { ...res, ...updates } : res))
    );
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  const assignTableToReservation = (reservationId: string, tableId: string, tableNumber: number | string) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === reservationId
          ? { ...res, tableId, tableNumber, status: "confirmed" }
          : res
      )
    );
  };

  const getReservationByTable = (tableId: string): Reservation | undefined => {
    return reservations.find((res) => res.tableId === tableId && res.status !== "completed" && res.status !== "cancelled");
  };

  const addPreOrderToReservation = (reservationId: string, item: InventoryItem, quantity: number): boolean => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return false;

    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== reservationId) return res;

        const currentPreOrder = res.preOrder || [];
        const existingItemIndex = currentPreOrder.findIndex(
          (orderItem) => orderItem.inventoryItemId === item.id
        );

        let newPreOrder: OrderItem[];
        if (existingItemIndex >= 0) {
          newPreOrder = currentPreOrder.map((orderItem, index) =>
            index === existingItemIndex
              ? {
                  ...orderItem,
                  quantity: orderItem.quantity + quantity,
                  total: (orderItem.quantity + quantity) * item.price,
                }
              : orderItem
          );
        } else {
          const newOrderItem: OrderItem = {
            id: `preorder-${reservationId}-${item.id}-${Date.now()}`,
            inventoryItemId: item.id,
            name: item.name,
            quantity,
            price: item.price,
            total: item.price * quantity,
            category: item.category,
            kitchenStatus: item.category === "Comida" ? "pending" : undefined,
          };
          newPreOrder = [...currentPreOrder, newOrderItem];
        }

        return { ...res, preOrder: newPreOrder };
      })
    );

    return true;
  };

  const removePreOrderItem = (reservationId: string, itemId: string) => {
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id !== reservationId || !res.preOrder) return res;
        
        const newPreOrder = res.preOrder.filter((item) => item.id !== itemId);
        return { ...res, preOrder: newPreOrder.length > 0 ? newPreOrder : undefined };
      })
    );
  };

  const activateReservationOrder = (reservationId: string): boolean => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || !reservation.preOrder || !reservation.tableId) return false;

    for (const item of reservation.preOrder) {
      const invItem = inventory.find(i => i.id === item.inventoryItemId);
      if (!invItem || invItem.quantity < item.quantity) {
        return false;
      }
    }

    reservation.preOrder.forEach(item => {
      decreaseInventory(item.inventoryItemId, item.quantity);
    });

    const tableNumber = typeof reservation.tableNumber === "number" ? reservation.tableNumber : 0;
    const tableId = reservation.tableId;
    
    setTableOrders((prev) => ({
      ...prev,
      [tableId]: {
        tableId,
        tableNumber,
        items: reservation.preOrder!,
        total: reservation.preOrder!.reduce((sum, item) => sum + item.total, 0),
        createdAt: new Date(),
        status: "active",
      },
    }));

    setReservations((prev) =>
      prev.map((res) =>
        res.id === reservationId
          ? { ...res, preOrder: undefined }
          : res
      )
    );

    return true;
  };

  return (
    <RestaurantContext.Provider
      value={{
        inventory,
        updateInventory,
        decreaseInventory,
        tableOrders,
        addItemToTable,
        removeItemFromTable,
        clearTableOrder,
        getTableTotal,
        markOrderReadyToPay,
        payOrder,
        orderHistory,
        updateKitchenItemStatus,
        updateOrderKitchenStatus,
        dispatchedOrders,
        resumeDispatchedOrder,
        reservations,
        addReservation,
        updateReservation,
        deleteReservation,
        assignTableToReservation,
        getReservationByTable,
        addPreOrderToReservation,
        removePreOrderItem,
        activateReservationOrder,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
};