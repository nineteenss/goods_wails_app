import { useState } from "react";

import { Flex, Text, Button, Tooltip } from "@mantine/core";
import { IconDownload, IconCheck } from "@tabler/icons-react";

interface CurrentVersionProps {
  version: string;
}

export const CurrentVersion = ({ version }: CurrentVersionProps) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  return (
    <Flex direction={"row"} gap={12} align={"center"}>
      <Flex direction={"row"} gap={6} align={"center"}>
        <Text size="sm" c="dimmed">
          v:
        </Text>
        <Tooltip label="Версия приложения">
          <Text size="sm" c="blue">
            {version}
          </Text>
        </Tooltip>
      </Flex>
      <Tooltip
        label={
          isUpdateAvailable
            ? "Доступно обновление (нажмите, чтобы обновить)"
            : "Вы используете последнюю версию"
        }
      >
        <Button
          size="compact-sm"
          variant="subtle"
          rightSection={
            isUpdateAvailable ? (
              <IconDownload size={18} />
            ) : (
              <IconCheck size={18} />
            )
          }
        >
          {isUpdateAvailable ? "Доступно обновление" : "Обновлений нет"}
        </Button>
      </Tooltip>
    </Flex>
  );
};
