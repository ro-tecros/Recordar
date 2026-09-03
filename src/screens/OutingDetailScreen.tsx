import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAppData } from '../store/AppDataProvider';
import type { RootStackParamList } from '../navigation';
import { InlineAdd } from '../components/InlineAdd';
import { PressableScale } from '../components/PressableScale';
import { useConfirm } from '../components/ConfirmSheet';
import { colors, radius, shadow, spacing } from '../theme';
import { enterDown, enterFade, exitUp, layoutSpring } from '../ui/motion';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OutingDetail'>;
type Rt = RouteProp<RootStackParamList, 'OutingDetail'>;

export function OutingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();
  const {
    getOuting,
    editOuting,
    toggleOutingDone,
    removeOuting,
    addOutingItem,
    removeOutingItem,
  } = useAppData();

  const outing = getOuting(route.params.id);
  const [title, setTitle] = useState(outing?.title ?? '');

  useEffect(() => {
    if (outing && outing.title !== title) setTitle(outing.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outing?.id]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Salida' });
  }, [navigation]);

  if (!outing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Esta salida ya no existe.</Text>
      </View>
    );
  }

  const commitTitle = () => {
    const clean = title.trim();
    if (clean && clean !== outing.title) editOuting(outing.id, { title: clean });
    else setTitle(outing.title);
  };

  const confirmDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar salida',
      message: `Se borrará “${outing.title}” y toda su lista.`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (ok) {
      await removeOuting(outing.id);
      navigation.goBack();
    }
  };

  const confirmRemoveItem = async (id: string, itemTitle: string) => {
    const ok = await confirm({
      title: 'Quitar de la lista',
      message: `“${itemTitle}” se quitará de esta salida.`,
      confirmText: 'Quitar',
      destructive: true,
    });
    if (ok) removeOutingItem(id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enterDown(0, 280)}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            onBlur={commitTitle}
            onSubmitEditing={commitTitle}
            placeholder="Nombre de la salida"
            placeholderTextColor={colors.textMuted}
            style={styles.titleInput}
            returnKeyType="done"
          />
        </Animated.View>

        <Text style={styles.label}>Qué no olvidar para esta salida</Text>
        <InlineAdd
          placeholder="Ej. Carnet de conducir"
          onAdd={(text) => addOutingItem(outing.id, text)}
        />

        <View style={styles.list}>
          {outing.items.length === 0 ? (
            <Animated.Text entering={enterFade()} style={styles.emptyText}>
              Anota aquí lo que necesitas llevar solo para esta salida.
            </Animated.Text>
          ) : (
            outing.items.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={enterDown(i)}
                exiting={exitUp()}
                layout={layoutSpring}
              >
                <PressableScale
                  onPress={() =>
                    navigation.navigate('ItemForm', {
                      mode: 'outingItem',
                      id: item.id,
                    })
                  }
                  scaleTo={0.98}
                  style={styles.item}
                >
                  <Ionicons
                    name="ellipse-outline"
                    size={20}
                    color={colors.borderStrong}
                  />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.note ? (
                      <Text style={styles.itemNote} numberOfLines={1}>
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => confirmRemoveItem(item.id, item.title)}
                    hitSlop={12}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </PressableScale>
              </Animated.View>
            ))
          )}
        </View>

        <PressableScale
          onPress={() => toggleOutingDone(outing.id)}
          style={styles.doneToggle}
        >
          <Ionicons
            name={outing.done ? 'refresh' : 'checkmark-circle-outline'}
            size={20}
            color={outing.done ? colors.warning : colors.success}
          />
          <Text
            style={[
              styles.doneToggleText,
              { color: outing.done ? colors.warning : colors.success },
            ]}
          >
            {outing.done
              ? 'Marcar como pendiente'
              : 'Marcar salida como completada'}
          </Text>
        </PressableScale>

        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Eliminar salida</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  titleInput: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  list: { gap: spacing.sm },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow('sm'),
  },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 16, color: colors.text, fontWeight: '600' },
  itemNote: { fontSize: 12, color: colors.textMuted },
  doneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  doneToggleText: { fontSize: 15, fontWeight: '800' },
  deleteBtn: { padding: spacing.md, alignItems: 'center' },
  deleteText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  missingText: { color: colors.textMuted, fontSize: 15 },
});
