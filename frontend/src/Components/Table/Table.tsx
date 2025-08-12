import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconEdit, IconPlus, IconMinus, IconSearch } from "@tabler/icons-react";

import {
  Table as MantineTable,
  Paper,
  Button,
  Textarea,
  Menu,
  Text,
  Input,
  Flex,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import {
  createItem,
  listItems,
  updateItem,
  withdrawItem,
  type Item,
} from "../../utils/api";

import { EventsOn, EventsOff } from "../../../wailsjs/runtime/runtime";

import { AddItemForm } from "../AddItemForm/AddItemForm";
import { AddItemButton } from "../Buttons/AddItemButton";

import styles from "./Table.module.css";

const quantityColorOnAmount = (amount: number) => {
  const min = 3;
  const warn = 5;

  if (amount >= 10) return "green";
  if (amount <= min) return "red";
  if (amount <= warn) return "orange";
};

const seed = [
  {
    id: 1,
    name: "Товар 1",
    quantity: 10,
    updated: "2024-05-01",
    comment: "",
  },
  {
    id: 2,
    name: "Товар 2",
    quantity: 5,
    updated: "2024-05-02",
    comment: "Срочно",
  },
  {
    id: 3,
    name: "Товар 3",
    quantity: 20,
    updated: "2024-05-03",
    comment: "Нет комментариев",
  },
];

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export function Table() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const itemsRef = useRef<Item[]>(items);
  const saveTimers = useRef<
    Record<number, ReturnType<typeof setTimeout> | null>
  >({});

  const refresh = () =>
    listItems()
      .then((data) => setItems(data ?? []))
      .catch(() => setItems(seed as unknown as Item[]));

  useEffect(() => {
    refresh();
    const off = EventsOn("items:changed", () => refresh());
    return () => {
      EventsOff("items:changed");
      if (typeof off === "function") off();
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  const scheduleCommentSave = (id: number, newComment: string) => {
    const existing = saveTimers.current[id];
    if (existing) clearTimeout(existing);
    saveTimers.current[id] = setTimeout(async () => {
      const current = itemsRef.current.find((i) => i.id === id);
      if (!current) return;
      try {
        await updateItem({
          id,
          name: current.name,
          quantity: current.quantity,
          comment: newComment,
        });
        notifications.show({
          id: `comment-saved-${id}`,
          color: "teal",
          message: "Комментарий сохранён",
          autoClose: 1200,
        });
      } catch (e) {
        notifications.show({
          id: `comment-save-error-${id}`,
          color: "red",
          message: "Не удалось сохранить комментарий",
          autoClose: 2000,
        });
      }
    }, 600);
  };

  const handleCommentChange = (id: number, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, comment: value } : it))
    );
    scheduleCommentSave(id, value);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const positions = filtered.length;
    const itemsTotal = filtered.reduce(
      (sum, it) => sum + (it.quantity || 0),
      0
    );
    window.dispatchEvent(
      new CustomEvent("ui:stats", { detail: { positions, itemsTotal } })
    );
  }, [filtered]);

  const openCreateModal = () => {
    modals.open({
      title: "Добавить позицию",
      children: (
        <AddItemForm
          submitLabel="Добавить"
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await createItem({ ...values, comment: "" });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
      radius: "12px",
    });
  };

  const openUpdateModal = (element: Item) => {
    modals.open({
      title: "Редактировать",
      children: (
        <AddItemForm
          initial={{
            name: element.name,
            quantity: element.quantity,
          }}
          mode="update"
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await updateItem({
              id: element.id,
              // only name should be updated; keep quantity and comment
              name: values.name,
              quantity: element.quantity,
              comment: element.comment,
            });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
      radius: "12px",
    });
  };

  const openWithdrawModal = (element: Item) => {
    modals.open({
      title: "Списать",
      children: (
        <AddItemForm
          initial={{ name: element.name, quantity: 0 }}
          submitLabel="Списать"
          mode="withdraw"
          maxQuantity={element.quantity}
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await withdrawItem({
              id: element.id,
              delta: values.quantity,
              comment: "",
            });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
      radius: "12px",
    });
  };

  const openAddQuantityModal = (element: Item) => {
    modals.open({
      title: "Добавить",
      children: (
        <AddItemForm
          initial={{ name: element.name, quantity: 0 }}
          submitLabel="Добавить"
          mode="add"
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await updateItem({
              id: element.id,
              name: element.name,
              quantity: element.quantity + values.quantity,
              comment: element.comment,
            });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
      radius: "12px",
    });
  };

  const rows = filtered.map((element) => (
    <MantineTable.Tr key={element.id}>
      <MantineTable.Td align="center">{element.id}</MantineTable.Td>
      <MantineTable.Td maw={300}>
        <Text truncate="end">{element.name}</Text>
      </MantineTable.Td>
      <MantineTable.Td
        align="center"
        style={{ color: quantityColorOnAmount(element.quantity) }}
      >
        {element.quantity}
      </MantineTable.Td>
      <MantineTable.Td align="center">
        {formatDate(element.updated)}
      </MantineTable.Td>
      <MantineTable.Td>
        <Textarea
          placeholder="Комментарий"
          classNames={{ input: styles.textarea_style }}
          value={element.comment}
          onChange={(e) =>
            handleCommentChange(element.id, e.currentTarget.value)
          }
        />
      </MantineTable.Td>
      <MantineTable.Td>
        <Menu
          withArrow
          arrowPosition="center"
          styles={{
            dropdown: {
              padding: 8,
              borderRadius: 12,
            },
            item: { borderRadius: 6 },
          }}
        >
          <Menu.Target>
            <Button size="sm" variant="subtle" w={"100%"}>
              <Text>Меню</Text>
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} color="orange" />}
              onClick={() => openUpdateModal(element)}
            >
              Редактировать
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPlus size={14} color="green" />}
              onClick={() => openAddQuantityModal(element)}
            >
              Добавить
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconMinus size={14} color="red" />}
              onClick={() => openWithdrawModal(element)}
            >
              Списать
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </MantineTable.Td>
    </MantineTable.Tr>
  ));

  return (
    <Flex direction={"column"} gap={0}>
      <Paper bg={"blue"} p="xs" className={styles.toolbar}>
        <Flex direction={"row"} gap="xs">
          <AddItemButton />
          <Input
            placeholder="Поиск по каталогу"
            leftSection={
              <IconSearch size={18} color="var(--mantine-color-gray-5)" />
            }
            radius="md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            w={"100%"}
          />
        </Flex>
      </Paper>
      <Paper withBorder p="xs" radius="lg" className={styles.table}>
        <MantineTable.ScrollContainer
          maxHeight={"calc(100dvh - 335px)"}
          minWidth={"100%"}
          type="native"
        >
          <MantineTable
            striped
            stickyHeader
            withColumnBorders
            withRowBorders={false}
            highlightOnHover
          >
            <MantineTable.Thead>
              <MantineTable.Tr>
                <MantineTable.Th>№</MantineTable.Th>
                <MantineTable.Th>Название позиции</MantineTable.Th>
                <MantineTable.Th>Кол-во</MantineTable.Th>
                <MantineTable.Th>Обновлено</MantineTable.Th>
                <MantineTable.Th>Комментарий</MantineTable.Th>
                <MantineTable.Th w={90}></MantineTable.Th>
              </MantineTable.Tr>
            </MantineTable.Thead>
            <MantineTable.Tbody>{rows}</MantineTable.Tbody>
          </MantineTable>
        </MantineTable.ScrollContainer>
      </Paper>
    </Flex>
  );
}
