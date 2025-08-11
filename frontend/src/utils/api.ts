// Simple API wrapper over Wails bindings
// These names must match exported Go methods in `App`.

type Item = {
  id: number;
  name: string;
  quantity: number;
  comment: string;
  updated: string;
};

export async function listItems(): Promise<Item[]> {
  // @ts-ignore - Wails injects window.go
  return await window.go.main.App.ListItems();
}

export async function createItem(payload: {
  name: string;
  quantity: number;
  comment: string;
}): Promise<Item> {
  // @ts-ignore
  return await window.go.main.App.CreateItem(
    payload.name,
    payload.quantity,
    payload.comment,
  );
}

export async function updateItem(payload: {
  id: number;
  name: string;
  quantity: number;
  comment: string;
}): Promise<Item> {
  // @ts-ignore
  return await window.go.main.App.UpdateItem(
    payload.id,
    payload.name,
    payload.quantity,
    payload.comment,
  );
}

export async function withdrawItem(payload: {
  id: number;
  delta: number;
  comment: string;
}): Promise<Item> {
  // @ts-ignore
  return await window.go.main.App.WithdrawQuantity(
    payload.id,
    payload.delta,
    payload.comment,
  );
}

export type { Item };

