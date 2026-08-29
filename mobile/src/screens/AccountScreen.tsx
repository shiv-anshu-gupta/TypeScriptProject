import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerProfileStore } from "@/features/customer/profile/store";
import type { CustomerAddressFormValues } from "@/features/customer/profile/types";
import { Button } from "@/components/ui/Button";
import { setAppLanguage, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The language switch — used on the Account screen and offered to signed-out
// users too, so anyone can flip हिंदी/English at any time.
function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const options: { code: AppLanguage; label: string }[] = [
    { code: "hi", label: "हिंदी" },
    { code: "en", label: "English" },
  ];
  return (
    <View>
      <Text className="mb-2 text-lg font-semibold text-foreground">
        {t("common.language")}
      </Text>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const active = i18n.language === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => void setAppLanguage(option.code)}
              className={cn(
                "flex-1 items-center rounded-xl border py-3",
                active
                  ? "border-primary bg-primary"
                  : "border-border bg-card",
              )}
            >
              <Text
                className={cn(
                  "text-base font-semibold",
                  active ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const formFields: {
  key: keyof Omit<CustomerAddressFormValues, "isDefault">;
  labelKey: string;
  placeholder: string;
}[] = [
  { key: "fullName", labelKey: "account.fullName", placeholder: "Jane Doe" },
  { key: "address", labelKey: "account.address", placeholder: "12 Market Street" },
  { key: "state", labelKey: "account.state", placeholder: "Maharashtra" },
  { key: "postalCode", labelKey: "account.postalCode", placeholder: "400001" },
];

function LinkRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-border py-4"
    >
      <View className="flex-row items-center gap-3">
        <Feather name={icon} size={18} color="#1f2a2e" />
        <Text className="text-base text-foreground">{label}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#ada291" />
    </Pressable>
  );
}

export function AccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const {
    items,
    mode,
    form,
    loadAddresses,
    startAdd,
    startEdit,
    updateForm,
    cancelForm,
    saveForm,
    removeAddress,
  } = useCustomerProfileStore((state) => state);

  useEffect(() => {
    if (isSignedIn) void loadAddresses();
  }, [isSignedIn, loadAddresses]);

  if (!isSignedIn) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-8"
        style={{ paddingTop: insets.top }}
      >
        <Feather name="user" size={36} color="#ada291" />
        <Text className="text-center text-base text-muted-foreground">
          {t("account.signedOutPrompt")}
        </Text>
        <View className="w-full gap-2">
          <Button
            label={t("common.signIn")}
            onPress={() => navigation.navigate("SignIn")}
          />
          <Button
            label={t("account.createAccount")}
            variant="outline"
            onPress={() => navigation.navigate("SignUp")}
          />
        </View>

        <View className="w-full">
          <LanguageToggle />
        </View>

        <Text
          className="text-xs text-muted-foreground underline"
          onPress={() => navigation.navigate("Legal")}
        >
          {t("auth.privacyTerms")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        padding: 16,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Text className="text-lg font-semibold text-foreground">
            {(user?.fullName ?? "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text className="text-lg font-semibold text-foreground">
            {user?.fullName ?? t("account.customer")}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? ""}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <LanguageToggle />
      </View>

      <View className="mb-4">
        <LinkRow
          icon="heart"
          label={t("account.savedProducts")}
          onPress={() => navigation.navigate("Wishlist")}
        />
        <LinkRow
          icon="shield"
          label={t("account.privacyTerms")}
          onPress={() => navigation.navigate("Legal")}
        />
      </View>

      {/* Addresses */}
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">
            {t("account.addresses")}
          </Text>
          {mode === "none" ? (
            <Pressable
              onPress={startAdd}
              className="flex-row items-center gap-1"
            >
              <Feather name="plus" size={16} color="#1f2a2e" />
              <Text className="text-sm font-semibold text-foreground">
                {t("account.add")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {mode !== "none" ? (
          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            {formFields.map((field) => (
              <View key={field.key} className="gap-1">
                <Text className="text-xs font-medium text-muted-foreground">
                  {t(field.labelKey)}
                </Text>
                <TextInput
                  value={form[field.key]}
                  onChangeText={(text) => updateForm(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor="#ada291"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-foreground"
                />
              </View>
            ))}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">
                {t("account.setDefault")}
              </Text>
              <Switch
                value={form.isDefault}
                onValueChange={(value) => updateForm("isDefault", value)}
              />
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={t("common.cancel")}
                  variant="outline"
                  onPress={cancelForm}
                />
              </View>
              <View className="flex-1">
                <Button label={t("common.save")} onPress={() => void saveForm()} />
              </View>
            </View>
          </View>
        ) : items.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            {t("account.noAddresses")}
          </Text>
        ) : (
          <View className="gap-2">
            {items.map((address) => (
              <View
                key={address._id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {address.fullName}
                  </Text>
                  {address.isDefault ? (
                    <Text className="text-xs font-semibold text-foreground">
                      {t("account.default")}
                    </Text>
                  ) : null}
                </View>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {address.address}, {address.state} {address.postalCode}
                </Text>
                <View className="mt-3 flex-row gap-4">
                  <Pressable
                    onPress={() => startEdit(address)}
                    className="flex-row items-center gap-1"
                  >
                    <Feather name="edit-2" size={14} color="#1f2a2e" />
                    <Text className="text-sm text-foreground">
                      {t("account.edit")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void removeAddress(address._id)}
                    className="flex-row items-center gap-1"
                  >
                    <Feather name="trash-2" size={14} color="#c0492f" />
                    <Text className="text-sm text-destructive">
                      {t("common.delete")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <Button
        label={t("account.signOut")}
        variant="outline"
        onPress={() => void signOut()}
      />
    </ScrollView>
  );
}
