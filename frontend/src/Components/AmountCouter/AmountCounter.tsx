import { Flex, Text, Badge, Tooltip } from "@mantine/core";

interface CurrentVersionProps {
  positions: number;
  items: number;
}

export const AmountCounter = ({ positions, items }: CurrentVersionProps) => {
  return (
    <Flex direction={"row"} gap={12} align={"center"}>
      <Flex direction={"row"} gap={6} align={"center"}>
        <Text size="sm" c="dimmed">
          Позиций
        </Text>
        <Tooltip label="Количество позиций на складе">
          <Badge size="sm" c="white">
            {positions}
          </Badge>
        </Tooltip>
      </Flex>

      <Flex direction={"row"} gap={6} align={"center"}>
        <Text size="sm" c="dimmed">
          Общее количество
        </Text>
        <Tooltip label="Общее количество товаров на складе">
          <Badge size="sm" c="white">
            {items}
          </Badge>
        </Tooltip>
      </Flex>
    </Flex>
  );
};
