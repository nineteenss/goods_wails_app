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
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { AddItemForm } from "../AddItemForm/AddItemForm";
import {
  createItem,
  listItems,
  updateItem,
  withdrawItem,
  type Item,
} from "../../utils/api";

import styles from "./Table.module.css";
import { EventsOn, EventsOff } from "../../../wailsjs/runtime/runtime";

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
      await updateItem({
        id,
        name: current.name,
        quantity: current.quantity,
        comment: newComment,
      });
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

  const openCreateModal = () => {
    modals.open({
      title: "Добавить позицию",
      children: (
        <AddItemForm
          submitLabel="Добавить"
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await createItem(values);
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
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
            comment: element.comment,
          }}
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await updateItem({ id: element.id, ...values });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
    });
  };

  const openWithdrawModal = (element: Item) => {
    modals.open({
      title: "Списать",
      children: (
        <AddItemForm
          initial={{ name: element.name, quantity: 0, comment: "" }}
          submitLabel="Списать"
          onCancel={() => modals.closeAll()}
          onSubmit={async (values) => {
            await withdrawItem({
              id: element.id,
              delta: values.quantity,
              comment: values.comment,
            });
            refresh();
            modals.closeAll();
          }}
        />
      ),
      centered: true,
    });
  };

  const rows = filtered.map((element) => (
    <MantineTable.Tr key={element.id}>
      <MantineTable.Td align="center">{element.id}</MantineTable.Td>
      <MantineTable.Td>{element.name}</MantineTable.Td>
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
              onClick={() => openCreateModal()}
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
    <Paper withBorder p="xs" radius="lg">
      <Input
        placeholder="Поиск по каталогу"
        leftSection={
          <IconSearch size={18} color="var(--mantine-color-gray-5)" />
        }
        mb="xs"
        radius="md"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
              <MantineTable.Th></MantineTable.Th>
            </MantineTable.Tr>
          </MantineTable.Thead>
          <MantineTable.Tbody>{rows}</MantineTable.Tbody>
        </MantineTable>
      </MantineTable.ScrollContainer>
    </Paper>
  );
}
