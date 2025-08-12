import { useEffect, useState } from "react";

import { Flex, Text, Button, Tooltip } from "@mantine/core";
import { IconDownload, IconCheck } from "@tabler/icons-react";
import pkg from "../../../package.json";
import {
  applyAndRestart,
  checkForUpdates,
  downloadUpdate,
  UpdateStatus,
} from "../../utils/api";
import { EventsOn } from "../../../wailsjs/runtime/runtime";

interface CurrentVersionProps {
  version?: string;
}

export const CurrentVersion = ({
  version = pkg.version,
}: CurrentVersionProps) => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    // inform backend about our current version and ask for updates
    checkForUpdates(version).then(setStatus);

    // subscribe to update events from backend
    const unsubscribeAvailable = EventsOn("update:available", () => {
      checkForUpdates(version).then(setStatus);
    });
    const unsubscribeDownloaded = EventsOn("update:downloaded", () => {
      setStatus((prev) =>
        prev ? { ...prev, downloaded: true, available: true } : prev
      );
    });

    return () => {
      unsubscribeAvailable && unsubscribeAvailable();
      unsubscribeDownloaded && unsubscribeDownloaded();
    };
  }, [version]);

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
          status?.available
            ? status?.downloaded
              ? "Обновление скачано (нажмите для перезапуска)"
              : "Доступно обновление (нажмите, чтобы скачать)"
            : "Вы используете последнюю версию"
        }
      >
        <Button
          size="compact-sm"
          variant="subtle"
          color={
            status?.available
              ? status?.downloaded
                ? "blue"
                : "orange"
              : "green"
          }
          rightSection={
            status?.available ? (
              <IconDownload size={18} />
            ) : (
              <IconCheck size={18} />
            )
          }
          onClick={async () => {
            if (!status?.available) return;
            if (status.downloaded) {
              await applyAndRestart();
              return;
            }
            const s = await downloadUpdate();
            setStatus(s);
          }}
        >
          {status?.available
            ? status.downloaded
              ? "Перезапустить и обновить"
              : "Доступно обновление"
            : "Обновлений нет"}
        </Button>
      </Tooltip>
    </Flex>
  );
};
