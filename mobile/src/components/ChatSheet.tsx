import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { ChatMessage } from "@/features/customer/grocery-list/types";
import {
  getGroceryListMessages,
  sendGroceryListMessage,
} from "@/features/customer/grocery-list/api";
import { toast } from "@/lib/toast";

// Poll for new messages only while the sheet is open — never in the background.
const POLL_MS = 5000;

type ChatSheetProps = {
  open: boolean;
  listId: string;
  code: string;
  onClose: () => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.sender === "customer";

  return (
    <View className={mine ? "items-end" : "items-start"}>
      <View
        className={
          mine
            ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2"
            : "max-w-[80%] rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-2"
        }
      >
        <Text
          className={
            mine ? "text-sm text-primary-foreground" : "text-sm text-foreground"
          }
        >
          {message.text}
        </Text>
      </View>
      <Text className="mx-1 mt-1 text-[10px] text-muted-foreground">
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}

// A bottom-sheet chat tied to one order. Slides up over the Lists screen, so
// the customer never leaves the page. Flex-based layout keeps the composer
// above the keyboard on both platforms.
export function ChatSheet({ open, listId, code, onClose }: ChatSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const response = await getGroceryListMessages(listId);
        setMessages(response?.messages ?? []);
      } catch {
        // a failed poll shouldn't disrupt the open conversation
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [listId],
  );

  // Load + poll while the sheet is open; stop the moment it closes.
  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setText("");
    void load();
    const timer = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [open, load]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText("");
    const optimistic: ChatMessage = {
      _id: `temp-${Date.now()}`,
      sender: "customer",
      senderName: "You",
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendGroceryListMessage(listId, body);
      await load(true);
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(body);
      toast.error(
        error instanceof Error ? error.message : t("chat.sendFailed"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tap the dimmed area above the sheet to close */}
        <Pressable
          onPress={onClose}
          className="bg-black/40"
          style={{ flex: 1 }}
        />

      <View
        className="rounded-t-3xl border border-border bg-background"
        style={{ flex: 6 }}
      >
        {/* Grab handle */}
        <View className="items-center pt-3">
          <View className="h-1.5 w-10 rounded-full bg-muted" />
        </View>

        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <MaterialCommunityIcons name="storefront" size={20} color="#3c5a64" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {t("lists.messageShop")}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {t("chat.aboutOrder", { code })}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <Feather name="x" size={16} color="#1f2a2e" />
          </Pressable>
        </View>

        <View className="h-px bg-border" />

        {/* Conversation */}
        {loading && !messages.length ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#3c5a64" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m._id}
            className="flex-1"
            contentContainerStyle={{
              padding: 16,
              gap: 10,
              flexGrow: 1,
            }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center gap-3 py-12">
                <Feather name="message-circle" size={38} color="#ada291" />
                <Text className="px-8 text-center text-sm text-muted-foreground">
                  {t("chat.empty")}
                </Text>
              </View>
            }
            renderItem={({ item }) => <Bubble message={item} />}
          />
        )}

        {/* Composer */}
        <View
          className="flex-row items-end gap-2 border-t border-border px-3 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("chat.placeholder")}
            placeholderTextColor="#ada291"
            multiline
            className="max-h-28 flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-base text-foreground"
          />
          <Pressable
            onPress={() => void onSend()}
            disabled={!text.trim() || sending}
            className={
              !text.trim() || sending
                ? "h-11 w-11 items-center justify-center rounded-full bg-muted"
                : "h-11 w-11 items-center justify-center rounded-full bg-primary"
            }
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Feather name="send" size={18} color="#ffffff" />
            )}
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
