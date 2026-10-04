/**
 * One of the three policy documents - Terms, Privacy or Refund - drawn from
 * the shared `LEGAL` text.
 *
 * @packageDocumentation
 */

import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { LEGAL } from "@/lib/legal/content";
import { LEGAL_DOC_IDS, type LegalLang } from "@/lib/legal/types";

type LegalRoute = RouteProp<RootStackParamList, "Legal">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const BULLET = "• ";

/**
 * Which language of the policy text to show for an i18next language code.
 *
 * @remarks
 * Hindi for any `hi*` code, English for everything else - the documents exist
 * only in those two.
 */
export function legalLang(language: string | undefined): LegalLang {
  return language?.startsWith("hi") ? "hi" : "en";
}

/**
 * A paragraph of a policy section, drawn as a bullet when it starts with "• ".
 */
function Paragraph({ text }: { text: string }) {
  if (text.startsWith(BULLET)) {
    return (
      <View className="mb-2 flex-row pl-2">
        <View className="mr-3 mt-2.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <Text className="flex-1 text-sm leading-6 text-muted-foreground">
          {text.slice(BULLET.length)}
        </Text>
      </View>
    );
  }
  return (
    <Text className="mb-2 text-sm leading-6 text-muted-foreground">{text}</Text>
  );
}

/**
 * A policy document as one scrolling page, reached from the links at the
 * foot of Account and from the consent line under the login.
 *
 * @remarks
 * The document is `LEGAL[doc][lang]`, where `doc` is the route parameter and
 * `lang` follows the app language. The stack header shows its title, so the
 * page itself starts at the "updated" line. The text is the same file the
 * website renders and ships with the build; this screen reads no store and
 * loads nothing.
 *
 * The links to the other two documents at the bottom use
 * `navigation.replace`, so moving between documents swaps the page rather
 * than stacking them: back always returns to where the customer came from.
 */
export function LegalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<LegalRoute>();
  const { t, i18n } = useTranslation();

  const doc = LEGAL[params.doc][legalLang(i18n.language)];
  const others = LEGAL_DOC_IDS.filter((id) => id !== params.doc);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {doc.updated ? (
        <Text className="text-xs text-muted-foreground">{doc.updated}</Text>
      ) : null}
      {doc.intro ? (
        <Text className="mt-3 text-sm leading-6 text-muted-foreground">
          {doc.intro}
        </Text>
      ) : null}

      {doc.sections.map((section, index) => (
        <View key={`${index}-${section.heading}`}>
          {section.heading ? (
            <Text className="mb-2 mt-6 text-lg font-semibold text-foreground">
              {section.heading}
            </Text>
          ) : null}
          {section.body.map((text, i) => (
            <Paragraph key={i} text={text} />
          ))}
        </View>
      ))}

      <View className="mt-8 flex-row flex-wrap justify-center gap-x-4 gap-y-2 border-t border-border pt-4">
        {others.map((id) => (
          <Pressable
            key={id}
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => navigation.replace("Legal", { doc: id })}
          >
            <Text className="text-xs font-medium text-primary">
              {t(`legal.${id}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
