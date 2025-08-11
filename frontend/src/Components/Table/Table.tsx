import React from "react";
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

import styles from "./Table.module.css";

const quantityColorOnAmount = (amount: number) => {
  const min = 3;
  const warn = 5;

  if (amount >= 10) return "green";
  if (amount <= min) return "red";
  if (amount <= warn) return "orange";
};

const elements = [
  {
    id: 1,
    name: "Товар 1",
    quantity: 10,
    updated: "2024-05-01",
    comment: "Нет комментариев",
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
  {
    id: 4,
    name: "Товар 4",
    quantity: 3,
    updated: "2024-05-04",
    comment: "Нет комментариев",
  },
  {
    id: 1,
    name: "Товар 1",
    quantity: 10,
    updated: "2024-05-01",
    comment: "Нет комментариев",
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
  {
    id: 4,
    name: "Товар 4",
    quantity: 3,
    updated: "2024-05-04",
    comment: "Нет комментариев",
  },
  {
    id: 1,
    name: "Товар 1",
    quantity: 10,
    updated: "2024-05-01",
    comment: "Нет комментариев",
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
  {
    id: 4,
    name: "Товар 4",
    quantity: 3,
    updated: "2024-05-04",
    comment: "Нет комментариев",
  },
];

export function Table() {
  const rows = elements.map((element) => (
    <MantineTable.Tr key={element.id}>
      <MantineTable.Td align="center">{element.id}</MantineTable.Td>
      <MantineTable.Td>{element.name}</MantineTable.Td>
      <MantineTable.Td
        align="center"
        style={{ color: quantityColorOnAmount(element.quantity) }}
      >
        {element.quantity}
      </MantineTable.Td>
      <MantineTable.Td align="center">{element.updated}</MantineTable.Td>
      <MantineTable.Td>
        <Textarea
          placeholder="Комментарий"
          classNames={{ input: styles.textarea_style }}
          value={element.comment}
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
            <Menu.Item leftSection={<IconEdit size={14} color="orange" />}>
              Редактировать
            </Menu.Item>
            <Menu.Item leftSection={<IconPlus size={14} color="green" />}>
              Добавить
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconMinus size={14} color="red" />}>
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
        onChange={(e) => {
          console.log(e.target.value);
        }}
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
