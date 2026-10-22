import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
const COLORS = {
    ink: '#2A211C',
    muted: '#85766C',
    red: '#C83B2B',
    redDark: '#9D2B20',
    cream: '#FFF9F1',
    paper: '#FFFFFF',
    line: '#F0E6DC',
    green: '#2E7655',
    softGreen: '#E9F4EC',
    softRed: '#FCEBE7',
    gold: '#E6A23C',
};
const MENU = [
    { id: 'calabresa', name: 'Calabresa da Casa', description: 'Calabresa, cebola roxa e orégano', price: 39.9, emoji: '🍕', category: 'Clássicas', tag: 'Mais pedida' },
    { id: 'margherita', name: 'Margherita', description: 'Muçarela, tomate fresco e manjericão', price: 42.9, emoji: '🍅', category: 'Clássicas' },
    { id: 'frango', name: 'Frango & Catupiry', description: 'Frango temperado e catupiry cremoso', price: 44.9, emoji: '🍗', category: 'Especiais', tag: 'Favorita' },
    { id: 'pepperoni', name: 'Pepperoni', description: 'Pepperoni, muçarela e molho artesanal', price: 48.9, emoji: '🌶️', category: 'Especiais' },
    { id: 'quatro-queijos', name: 'Quatro Queijos', description: 'Muçarela, parmesão, provolone e gorgonzola', price: 47.9, emoji: '🧀', category: 'Especiais' },
    { id: 'chocolate', name: 'Chocolate & Morango', description: 'Chocolate cremoso, morangos e carinho', price: 41.9, emoji: '🍓', category: 'Doces', tag: 'Sobremesa' },
];
const INGREDIENT_GROUPS = [
    {
        id: 'sauce', title: '1. Escolha o molho', subtitle: 'Escolha uma opção', single: true,
        options: [
            { label: 'Nenhum', price: 0 }, { label: 'Tomate artesanal', price: 0 }, { label: 'Molho branco', price: 2 },
            { label: 'Barbecue', price: 2 }, { label: 'Leite condensado', price: 3.5 },
        ],
    },
    {
        id: 'cheese', title: '2. Queijo', subtitle: 'A base perfeita', single: true,
        options: [
            { label: 'Sem queijo', price: 0 }, { label: 'Muçarela', price: 0 }, { label: 'Catupiry', price: 4 },
            { label: 'Cheddar', price: 4 }, { label: 'Quatro queijos', price: 6 },
        ],
    },
    {
        id: 'proteins', title: '3. Proteínas', subtitle: 'Pode escolher mais de uma',
        options: [
            { label: 'Calabresa', price: 4 }, { label: 'Frango desfiado', price: 4 }, { label: 'Pepperoni', price: 5 },
            { label: 'Bacon crocante', price: 5 }, { label: 'Presunto', price: 3 },
        ],
    },
    {
        id: 'extras', title: '4. Complementos', subtitle: 'Seu toque especial',
        options: [
            { label: 'Tomate', price: 2 }, { label: 'Cebola roxa', price: 1.5 }, { label: 'Azeitona', price: 1.5 },
            { label: 'Milho', price: 2 }, { label: 'Manjericão', price: 1.5 }, { label: 'Morango', price: 3 },
            { label: 'Chocolate', price: 4 }, { label: 'Orégano', price: 0.5 },
        ],
    },
];
const STATUS_STEPS = [
    { id: 'confirmed', label: 'Pedido confirmado', detail: 'Recebemos seu pedido!', emoji: '✅' },
    { id: 'preparing', label: 'Sendo preparado', detail: 'A cozinha já está trabalhando nele.', emoji: '👨‍🍳' },
    { id: 'baking', label: 'No forno', detail: 'Sua pizza está ficando douradinha.', emoji: '🔥' },
    { id: 'out_for_delivery', label: 'Saiu para entrega', detail: 'Nosso entregador está a caminho.', emoji: '🛵' },
    { id: 'delivered', label: 'Entregue', detail: 'Bom apetite! Até a próxima.', emoji: '💚' },
];
const STORAGE = { cart: '@pizzaria/cart', orders: '@pizzaria/orders', profile: '@pizzaria/profile' };
const DEFAULT_ADDRESS = { name: '', phone: '', street: '', number: '', neighborhood: '', city: '', complement: '' };
const money = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});
const formatAddress = (address) => [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    address.city,
].filter(Boolean).join(' · ');
async function notifyStatus(status, orderNumber) {
    const step = STATUS_STEPS.find((item) => item.id === status);
    if (!step)
        return;
    try {
        const { status: permission } = await Notifications.getPermissionsAsync();
        if (permission !== 'granted')
            return;
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `πzzaria · ${step.label}`,
                body: `${step.detail} Pedido #${orderNumber.slice(-5)}.`,
                sound: true,
            },
            trigger: null,
        });
    }
    catch (error) {
        console.warn('Não foi possível exibir a notificação local:', error);
    }
}
function PizzariaApp() {
    const [screen, setScreen] = useState('home');
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState(DEFAULT_ADDRESS);
    const [hydrated, setHydrated] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');
    const [toast, setToast] = useState('');
    const [locating, setLocating] = useState(false);
    const [pizzaSize, setPizzaSize] = useState('Grande');
    const [builderSelections, setBuilderSelections] = useState({
        sauce: ['Tomate artesanal'], cheese: ['Muçarela'], proteins: [], extras: [],
    });
    useEffect(() => {
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('pedidos', {
                name: 'Atualizações de pedidos',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: COLORS.red,
            }).catch((error) => console.warn('Não foi possível configurar o canal de notificações:', error));
        }
    }, []);
    useEffect(() => {
        const load = async () => {
            try {
                const [savedCart, savedOrders, savedProfile] = await Promise.all([
                    AsyncStorage.getItem(STORAGE.cart), AsyncStorage.getItem(STORAGE.orders), AsyncStorage.getItem(STORAGE.profile),
                ]);
                if (savedCart)
                    setCart(JSON.parse(savedCart));
                if (savedOrders)
                    setOrders(JSON.parse(savedOrders));
                if (savedProfile)
                    setProfile({ ...DEFAULT_ADDRESS, ...JSON.parse(savedProfile) });
            }
            catch (error) {
                console.warn('Não foi possível carregar os dados salvos:', error);
            }
            finally {
                setHydrated(true);
            }
        };
        load();
    }, []);
    useEffect(() => {
        if (!hydrated)
            return;
        AsyncStorage.multiSet([
            [STORAGE.cart, JSON.stringify(cart)],
            [STORAGE.orders, JSON.stringify(orders)],
            [STORAGE.profile, JSON.stringify(profile)],
        ]).catch((error) => console.warn('Falha ao salvar os dados:', error));
    }, [cart, orders, profile, hydrated]);
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const deliveryFee = subtotal === 0 || subtotal >= 70 ? 0 : 5.99;
    const total = subtotal + deliveryFee;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(''), 2300);
    }, []);
    const addPizza = (pizza) => {
        setCart((current) => {
            const existing = current.find((item) => item.id === pizza.id);
            if (existing)
                return current.map((item) => item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...current, { id: pizza.id, name: pizza.name, description: pizza.description, price: pizza.price, quantity: 1, emoji: pizza.emoji }];
        });
        showToast(`${pizza.name} adicionada ao carrinho`);
    };
    const changeQuantity = (id, delta) => {
        setCart((current) => current
            .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
            .filter((item) => item.quantity > 0));
    };
    const toggleIngredient = (group, label) => {
        setBuilderSelections((current) => {
            const selected = current[group.id] ?? [];
            const next = selected.includes(label)
                ? selected.filter((item) => item !== label)
                : group.single ? [label] : [...selected, label];
            return { ...current, [group.id]: next };
        });
    };
    const builderPrice = useMemo(() => {
        const base = pizzaSize === 'Média' ? 29.9 : pizzaSize === 'Grande' ? 37.9 : 45.9;
        const extras = INGREDIENT_GROUPS.reduce((sum, group) => sum + (builderSelections[group.id] ?? []).reduce((groupSum, name) => {
            return groupSum + (group.options.find((option) => option.label === name)?.price ?? 0);
        }, 0), 0);
        return base + extras;
    }, [pizzaSize, builderSelections]);
    const addCustomPizza = () => {
        const detailParts = [
            `Tamanho ${pizzaSize.toLowerCase()}`,
            ...INGREDIENT_GROUPS.map((group) => `${group.title.split('. ')[1]}: ${(builderSelections[group.id] ?? []).join(', ') || 'nenhum'}`),
        ];
        const customPizza = {
            id: `custom-${uid()}`, name: 'Pizza do meu jeito', description: detailParts.join(' · '),
            price: builderPrice, quantity: 1, emoji: '🍕',
        };
        setCart((current) => [...current, customPizza]);
        showToast('Sua pizza personalizada foi adicionada!');
        setScreen('cart');
    };
    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permissão necessária', 'Ative o acesso à localização nas configurações do celular para preencher o endereço automaticamente.');
                return;
            }
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const results = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            const place = results[0];
            if (!place) {
                Alert.alert('Endereço não encontrado', 'Não conseguimos converter sua localização em endereço. Preencha os campos manualmente.');
                return;
            }
            setProfile((current) => ({
                ...current,
                street: place.street ?? place.name ?? current.street,
                number: place.streetNumber ?? current.number,
                neighborhood: place.district ?? place.subregion ?? current.neighborhood,
                city: [place.city ?? place.subregion, place.region].filter(Boolean).join(' - ') || current.city,
            }));
            showToast('Localização adicionada ao endereço');
        }
        catch (error) {
            Alert.alert('Erro de localização', 'Não foi possível obter seu endereço agora. Confira se o GPS está ativado e tente novamente.');
        }
        finally {
            setLocating(false);
        }
    };
    const placeOrder = async () => {
        if (!cart.length) {
            Alert.alert('Carrinho vazio', 'Adicione uma pizza antes de finalizar.');
            return;
        }
        if (!profile.name.trim() || !profile.phone.trim() || !profile.street.trim() || !profile.city.trim()) {
            Alert.alert('Faltam alguns dados', 'Preencha nome, telefone, rua e cidade para continuar.');
            return;
        }
        try {
            const permission = await Notifications.getPermissionsAsync();
            if (permission.status !== 'granted')
                await Notifications.requestPermissionsAsync();
        }
        catch { /* Notificações podem não estar disponíveis em todos os ambientes. */ }
        // O pedido é salvo somente no armazenamento local deste aparelho.
        // Nenhuma API, servidor ou serviço de backend é chamado.
        const trackingCode = uuid();
        const addressLabel = formatAddress(profile);
        const newOrder = {
            id: uid(), trackingCode, status: 'confirmed', items: cart, total, address: addressLabel,
            createdAt: new Date().toISOString(),
        };
        setOrders((current) => [newOrder, ...current]);
        setCart([]);
        setScreen('orders');
        await notifyStatus('confirmed', newOrder.trackingCode);
        showToast('Pedido salvo neste aparelho (demonstração)');
    };
    const advanceDemoOrder = async (order) => {
        const index = STATUS_STEPS.findIndex((step) => step.id === order.status);
        const next = STATUS_STEPS[Math.min(index + 1, STATUS_STEPS.length - 1)];
        if (!next || next.id === order.status)
            return;
        setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: next.id } : item));
        await notifyStatus(next.id, order.trackingCode);
    };
    const filteredMenu = MENU.filter((pizza) => {
        const matchesCategory = category === 'Todas' || pizza.category === category;
        const matchesSearch = `${pizza.name} ${pizza.description}`.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    if (!hydrated) {
        return React.createElement(SafeAreaView, { style: styles.loadingScreen },
            React.createElement(ActivityIndicator, { size: "large", color: COLORS.red }),
            React.createElement(Text, { style: styles.loadingText }, "Preparando o forno..."));
    }
    const pageTitle = screen === 'cart' ? 'Seu carrinho' : screen === 'checkout' ? 'Finalizar pedido' : null;
    return (React.createElement(SafeAreaView, { style: styles.safeArea, edges: ['top', 'left', 'right'] },
        React.createElement(StatusBar, { barStyle: "dark-content", backgroundColor: COLORS.cream }),
        React.createElement(View, { style: styles.header },
            React.createElement(Pressable, { onPress: () => setScreen('home'), style: styles.brandBlock, accessibilityRole: "button", accessibilityLabel: "Ir para o in\u00EDcio" },
                React.createElement(View, { style: styles.logoMark },
                    React.createElement(Text, { style: styles.logoPi }, "\u03C0"),
                    React.createElement(Text, { style: styles.logoDot }, ".")),
                React.createElement(View, null,
                    React.createElement(Text, { style: styles.brandName }, "\u03C0zzaria"),
                    React.createElement(Text, { style: styles.brandSubtitle }, "PIZZA FEITA COM AFETO"))),
            React.createElement(Pressable, { onPress: () => setScreen('cart'), style: styles.cartButton, accessibilityRole: "button", accessibilityLabel: `Carrinho, ${itemCount} itens` },
                React.createElement(Text, { style: styles.cartIcon }, "\uD83D\uDECD\uFE0F"),
                itemCount > 0 && React.createElement(View, { style: styles.cartBadge },
                    React.createElement(Text, { style: styles.cartBadgeText }, itemCount)))),
        pageTitle && (React.createElement(View, { style: styles.subHeader },
            React.createElement(Pressable, { onPress: () => setScreen(screen === 'checkout' ? 'cart' : 'home'), style: styles.backButton },
                React.createElement(Text, { style: styles.backButtonText }, "\u2039")),
            React.createElement(Text, { style: styles.subHeaderTitle }, pageTitle))),
        React.createElement(KeyboardAvoidingView, { style: styles.flex, behavior: Platform.OS === 'ios' ? 'padding' : undefined },
            React.createElement(ScrollView, { keyboardShouldPersistTaps: "handled", contentContainerStyle: styles.pageContent, showsVerticalScrollIndicator: false },
                screen === 'home' && (React.createElement(React.Fragment, null,
                    React.createElement(Pressable, { style: styles.addressStrip, onPress: () => setScreen('profile') },
                        React.createElement(Text, { style: styles.pinIcon }, "\u2316"),
                        React.createElement(View, { style: styles.addressStripText },
                            React.createElement(Text, { style: styles.addressEyebrow }, "ENTREGAR EM"),
                            React.createElement(Text, { numberOfLines: 1, style: styles.addressMain }, profile.street ? `${profile.street}${profile.number ? `, ${profile.number}` : ''}` : 'Adicione seu endereço')),
                        React.createElement(Text, { style: styles.chevron }, "\u203A")),
                    React.createElement(View, { style: styles.hero },
                        React.createElement(View, { style: styles.heroCopy },
                            React.createElement(View, { style: styles.heroPill },
                                React.createElement(Text, { style: styles.heroPillText }, "MASSA FRESCA TODO DIA")),
                            React.createElement(Text, { style: styles.heroTitle },
                                "Seu momento",
                                '\n',
                                "merece uma",
                                '\n',
                                "\u03C0zzaria."),
                            React.createElement(Text, { style: styles.heroDescription }, "Ingredientes de verdade. Sabor que vira hist\u00F3ria."),
                            React.createElement(Pressable, { style: styles.heroButton, onPress: () => setScreen('builder') },
                                React.createElement(Text, { style: styles.heroButtonText },
                                    "Monte sua pizza ",
                                    React.createElement(Text, { style: styles.heroArrow }, "\u2197")))),
                        React.createElement(View, { style: styles.heroPizza },
                            React.createElement(Text, { style: styles.heroPizzaEmoji }, "\uD83C\uDF55"),
                            React.createElement(View, { style: styles.heroSparkle },
                                React.createElement(Text, null, "\u2726"))),
                        React.createElement(View, { style: styles.heroCircle })),
                    React.createElement(View, { style: styles.sectionHeading },
                        React.createElement(View, null,
                            React.createElement(Text, { style: styles.eyebrow }, "FEITAS PARA VOC\u00CA"),
                            React.createElement(Text, { style: styles.sectionTitle }, "O que vai ser hoje?")),
                        React.createElement(Text, { style: styles.headingEmoji }, "\u2661")),
                    React.createElement(View, { style: styles.searchBox },
                        React.createElement(Text, { style: styles.searchIcon }, "\u2315"),
                        React.createElement(TextInput, { value: search, onChangeText: setSearch, placeholder: "Busque seu sabor favorito", placeholderTextColor: "#A99B91", style: styles.searchInput })),
                    React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.categoryRow }, ['Todas', 'Clássicas', 'Especiais', 'Doces'].map((item) => React.createElement(Pressable, { key: item, onPress: () => setCategory(item), style: [styles.categoryPill, category === item && styles.categoryPillActive] },
                        React.createElement(Text, { style: [styles.categoryText, category === item && styles.categoryTextActive] }, item)))),
                    React.createElement(View, { style: styles.menuGrid }, filteredMenu.map((pizza) => React.createElement(MenuCard, { key: pizza.id, pizza: pizza, onAdd: () => addPizza(pizza) }))),
                    filteredMenu.length === 0 && React.createElement(EmptyState, { emoji: "\uD83D\uDD0E", title: "N\u00E3o achamos esse sabor", subtitle: "Tente outro nome ou categoria." }),
                    React.createElement(Pressable, { style: styles.customBanner, onPress: () => setScreen('builder') },
                        React.createElement(View, { style: styles.customBannerIcon },
                            React.createElement(Text, null, "\uD83C\uDFA8")),
                        React.createElement(View, { style: styles.customBannerCopy },
                            React.createElement(Text, { style: styles.customBannerTitle }, "Sua pizza, suas regras"),
                            React.createElement(Text, { style: styles.customBannerText }, "Misture sabores e crie uma combina\u00E7\u00E3o s\u00F3 sua.")),
                        React.createElement(Text, { style: styles.customBannerArrow }, "\u2192")))),
                screen === 'builder' && (React.createElement(React.Fragment, null,
                    React.createElement(View, { style: styles.builderIntro },
                        React.createElement(Text, { style: styles.eyebrow }, "DO SEU JEITINHO"),
                        React.createElement(Text, { style: styles.screenTitle }, "Crie sua obra-prima \uD83C\uDF55"),
                        React.createElement(Text, { style: styles.bodyText }, "Voc\u00EA escolhe cada detalhe. A gente prepara com carinho.")),
                    React.createElement(Text, { style: styles.fieldLabel }, "Tamanho da pizza"),
                    React.createElement(View, { style: styles.sizeRow }, ['Média', 'Grande', 'Família'].map((size) => React.createElement(Pressable, { key: size, onPress: () => setPizzaSize(size), style: [styles.sizeCard, pizzaSize === size && styles.sizeCardActive] },
                        React.createElement(Text, { style: styles.sizeEmoji }, size === 'Média' ? '🍕' : size === 'Grande' ? '🍕🍕' : '🍕🍕🍕'),
                        React.createElement(Text, { style: [styles.sizeName, pizzaSize === size && styles.sizeNameActive] }, size),
                        React.createElement(Text, { style: styles.sizePrice }, money(size === 'Média' ? 29.9 : size === 'Grande' ? 37.9 : 45.9))))),
                    INGREDIENT_GROUPS.map((group) => React.createElement(View, { key: group.id, style: styles.ingredientSection },
                        React.createElement(View, { style: styles.ingredientHeading },
                            React.createElement(View, null,
                                React.createElement(Text, { style: styles.ingredientTitle }, group.title),
                                React.createElement(Text, { style: styles.ingredientSubtitle }, group.subtitle)),
                            React.createElement(Text, { style: styles.ingredientSelected },
                                (builderSelections[group.id] ?? []).length,
                                " selecionado(s)")),
                        React.createElement(View, { style: styles.optionsWrap }, group.options.map((option) => { const selected = (builderSelections[group.id] ?? []).includes(option.label); return React.createElement(Pressable, { key: option.label, onPress: () => toggleIngredient(group, option.label), style: [styles.ingredientChip, selected && styles.ingredientChipActive] },
                            React.createElement(Text, { style: [styles.ingredientCheck, selected && styles.ingredientCheckActive] }, selected ? '✓' : '+'),
                            React.createElement(Text, { style: [styles.ingredientLabel, selected && styles.ingredientLabelActive] }, option.label),
                            option.price > 0 && React.createElement(Text, { style: [styles.ingredientPrice, selected && styles.ingredientLabelActive] },
                                "+",
                                money(option.price))); })))),
                    React.createElement(View, { style: styles.priceSummary },
                        React.createElement(View, null,
                            React.createElement(Text, { style: styles.priceSummaryLabel }, "Sua cria\u00E7\u00E3o"),
                            React.createElement(Text, { style: styles.priceSummaryValue }, money(builderPrice))),
                        React.createElement(Pressable, { style: styles.primaryButton, onPress: addCustomPizza },
                            React.createElement(Text, { style: styles.primaryButtonText }, "Adicionar ao carrinho +"))))),
                screen === 'cart' && (React.createElement(React.Fragment, null, cart.length === 0 ? React.createElement(EmptyState, { emoji: "\uD83D\uDECD\uFE0F", title: "Seu carrinho est\u00E1 vazio", subtitle: "Que tal escolher uma pizza bem gostosa?", actionLabel: "Ver card\u00E1pio", onAction: () => setScreen('home') }) : React.createElement(React.Fragment, null,
                    React.createElement(Text, { style: styles.eyebrow }, "QUASE L\u00C1"),
                    React.createElement(Text, { style: styles.screenTitle }, "Seu pedido, do seu jeito."),
                    cart.map((item) => React.createElement(View, { key: item.id, style: styles.cartItem },
                        React.createElement(View, { style: styles.pizzaThumb },
                            React.createElement(Text, { style: styles.pizzaThumbEmoji }, item.emoji)),
                        React.createElement(View, { style: styles.cartItemCopy },
                            React.createElement(Text, { style: styles.cartItemName }, item.name),
                            React.createElement(Text, { numberOfLines: 2, style: styles.cartItemDescription }, item.description),
                            React.createElement(Text, { style: styles.cartItemPrice }, money(item.price))),
                        React.createElement(View, { style: styles.quantityControl },
                            React.createElement(Pressable, { onPress: () => changeQuantity(item.id, -1), style: styles.quantityButton },
                                React.createElement(Text, { style: styles.quantityButtonText }, "\u2212")),
                            React.createElement(Text, { style: styles.quantityNumber }, item.quantity),
                            React.createElement(Pressable, { onPress: () => changeQuantity(item.id, 1), style: styles.quantityButton },
                                React.createElement(Text, { style: styles.quantityButtonText }, "+"))))),
                    React.createElement(View, { style: styles.summaryCard },
                        React.createElement(SummaryLine, { label: "Subtotal", value: money(subtotal) }),
                        React.createElement(SummaryLine, { label: "Entrega", value: deliveryFee === 0 ? 'Grátis' : money(deliveryFee), green: deliveryFee === 0 }),
                        subtotal > 0 && subtotal < 70 && React.createElement(Text, { style: styles.shippingHint },
                            "Pe\u00E7a mais ",
                            money(70 - subtotal),
                            " e ganhe entrega gr\u00E1tis."),
                        React.createElement(View, { style: styles.summaryDivider }),
                        React.createElement(SummaryLine, { label: "Total", value: money(total), strong: true })),
                    React.createElement(Pressable, { style: styles.checkoutButton, onPress: () => setScreen('checkout') },
                        React.createElement(Text, { style: styles.checkoutButtonText },
                            "Continuar para entrega ",
                            React.createElement(Text, { style: styles.checkoutArrow }, "\u2192"))),
                    React.createElement(Pressable, { style: styles.linkButton, onPress: () => setScreen('home') },
                        React.createElement(Text, { style: styles.linkButtonText }, "+ Adicionar mais pizzas"))))),
                screen === 'checkout' && (React.createElement(React.Fragment, null,
                    React.createElement(View, { style: styles.checkoutIntro },
                        React.createElement(Text, { style: styles.eyebrow }, "ENTREGA"),
                        React.createElement(Text, { style: styles.screenTitle }, "Onde entregamos?"),
                        React.createElement(Text, { style: styles.bodyText }, "Use sua localiza\u00E7\u00E3o para preencher o endere\u00E7o automaticamente ou digite os dados.")),
                    React.createElement(Pressable, { style: [styles.locationButton, locating && styles.disabledButton], onPress: useCurrentLocation, disabled: locating },
                        React.createElement(Text, { style: styles.locationButtonIcon }, locating ? '◌' : '⌖'),
                        React.createElement(View, { style: styles.locationButtonCopy },
                            React.createElement(Text, { style: styles.locationButtonTitle }, locating ? 'Buscando sua localização...' : 'Usar minha localização atual'),
                            React.createElement(Text, { style: styles.locationButtonSubtitle }, "Precisamos da permiss\u00E3o do GPS")),
                        locating ? React.createElement(ActivityIndicator, { color: COLORS.red }) : React.createElement(Text, { style: styles.chevron }, "\u203A")),
                    React.createElement(Text, { style: styles.fieldLabel }, "Seus dados"),
                    React.createElement(FormInput, { label: "Nome completo *", value: profile.name, onChangeText: (value) => setProfile((current) => ({ ...current, name: value })), placeholder: "Como podemos te chamar?" }),
                    React.createElement(FormInput, { label: "Telefone / WhatsApp *", value: profile.phone, onChangeText: (value) => setProfile((current) => ({ ...current, phone: value })), placeholder: "(00) 00000-0000", keyboardType: "phone-pad" }),
                    React.createElement(Text, { style: styles.fieldLabel }, "Endere\u00E7o de entrega"),
                    React.createElement(FormInput, { label: "Rua / Avenida *", value: profile.street, onChangeText: (value) => setProfile((current) => ({ ...current, street: value })), placeholder: "Nome da rua" }),
                    React.createElement(View, { style: styles.formTwoColumns },
                        React.createElement(View, { style: styles.formColumn },
                            React.createElement(FormInput, { label: "N\u00FAmero", value: profile.number, onChangeText: (value) => setProfile((current) => ({ ...current, number: value })), placeholder: "N\u00BA", keyboardType: "number-pad" })),
                        React.createElement(View, { style: styles.formColumn },
                            React.createElement(FormInput, { label: "Bairro", value: profile.neighborhood, onChangeText: (value) => setProfile((current) => ({ ...current, neighborhood: value })), placeholder: "Seu bairro" }))),
                    React.createElement(FormInput, { label: "Cidade / Estado *", value: profile.city, onChangeText: (value) => setProfile((current) => ({ ...current, city: value })), placeholder: "Cidade - UF" }),
                    React.createElement(FormInput, { label: "Complemento (opcional)", value: profile.complement, onChangeText: (value) => setProfile((current) => ({ ...current, complement: value })), placeholder: "Apto, bloco, ponto de refer\u00EAncia" }),
                    React.createElement(View, { style: styles.checkoutTotal },
                        React.createElement(Text, { style: styles.checkoutTotalLabel }, "Total do pedido"),
                        React.createElement(Text, { style: styles.checkoutTotalValue }, money(total))),
                    React.createElement(Pressable, { style: styles.checkoutButton, onPress: placeOrder },
                        React.createElement(Text, { style: styles.checkoutButtonText },
                            'Confirmar pedido',
                            " ",
                            React.createElement(Text, { style: styles.checkoutArrow }, "\u2192"))),
                    React.createElement(Text, { style: styles.checkoutFootnote }, 'Modo local: o pedido fica salvo apenas neste aparelho. Nenhum pagamento é processado.'))),
                screen === 'orders' && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { style: styles.eyebrow }, "ACOMPANHE DE PERTO"),
                    React.createElement(Text, { style: styles.screenTitle }, "O caminho da sua pizza."),
                    React.createElement(Text, { style: styles.bodyText }, "A gente te avisa a cada etapa do preparo e da entrega."),
                    orders.length === 0 ? (React.createElement(EmptyState, { emoji: "\uD83D\uDEF5", title: "Nenhum pedido por aqui", subtitle: "Quando pedir sua pr\u00F3xima pizza, o acompanhamento aparece nesta tela.", actionLabel: "Escolher uma pizza", onAction: () => setScreen('home') })) : (orders.map((order) => {
                        const currentIndex = STATUS_STEPS.findIndex((step) => step.id === order.status);
                        return (React.createElement(View, { key: order.id, style: styles.orderCard },
                            React.createElement(View, { style: styles.orderCardTop },
                                React.createElement(View, null,
                                    React.createElement(Text, { style: styles.orderNumber },
                                        "PEDIDO #",
                                        order.trackingCode.slice(-5).toUpperCase()),
                                    React.createElement(Text, { style: styles.orderDate }, new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))),
                                React.createElement(View, { style: styles.statusBadge },
                                    React.createElement(Text, { style: styles.statusBadgeText }, STATUS_STEPS.find((step) => step.id === order.status)?.label ?? 'Em andamento'))),
                            React.createElement(View, { style: styles.orderLine }),
                            order.items.map((item) => (React.createElement(Text, { key: item.id, style: styles.orderItemLine },
                                item.quantity,
                                "\u00D7 ",
                                item.name))),
                            React.createElement(View, { style: styles.orderMetaRow },
                                React.createElement(Text, { style: styles.orderMetaLabel }, "Entrega em"),
                                React.createElement(Text, { numberOfLines: 2, style: styles.orderMetaValue }, order.address)),
                            React.createElement(View, { style: styles.orderMetaRow },
                                React.createElement(Text, { style: styles.orderMetaLabel }, "Total"),
                                React.createElement(Text, { style: styles.orderTotal }, money(order.total))),
                            React.createElement(View, { style: styles.timeline }, STATUS_STEPS.map((step, index) => {
                                const complete = index <= currentIndex;
                                const current = index === currentIndex;
                                return (React.createElement(View, { key: step.id, style: styles.timelineRow },
                                    React.createElement(View, { style: styles.timelineRail },
                                        index > 0 && React.createElement(View, { style: [styles.timelineTopLine, complete && styles.timelineLineDone] }),
                                        React.createElement(View, { style: [styles.timelineDot, complete && styles.timelineDotDone, current && styles.timelineDotCurrent] },
                                            React.createElement(Text, { style: [styles.timelineDotText, complete && styles.timelineDotTextDone] }, complete ? '✓' : '')),
                                        index < STATUS_STEPS.length - 1 && React.createElement(View, { style: [styles.timelineBottomLine, index < currentIndex && styles.timelineLineDone] })),
                                    React.createElement(View, { style: styles.timelineContent },
                                        React.createElement(Text, { style: [styles.timelineLabel, current && styles.timelineLabelCurrent] },
                                            step.emoji,
                                            "  ",
                                            step.label),
                                        React.createElement(Text, { style: styles.timelineDetail }, step.detail))));
                            })),
                            order.status !== 'delivered' && (React.createElement(Pressable, { style: styles.demoAdvanceButton, onPress: () => advanceDemoOrder(order) },
                                React.createElement(Text, { style: styles.demoAdvanceText }, "Simular pr\u00F3xima etapa (demonstra\u00E7\u00E3o) \u2192"))),
                            null));
                    })))),
                screen === 'profile' && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { style: styles.eyebrow }, "TUDO NO SEU TEMPO"),
                    React.createElement(Text, { style: styles.screenTitle }, "Sua conta \u03C0zzaria"),
                    React.createElement(View, { style: styles.profileHero },
                        React.createElement(View, { style: styles.profileAvatar },
                            React.createElement(Text, { style: styles.profileAvatarText }, profile.name.trim() ? profile.name.trim().charAt(0).toUpperCase() : 'π')),
                        React.createElement(View, { style: styles.profileHeroCopy },
                            React.createElement(Text, { style: styles.profileName }, profile.name.trim() || 'Olá, pizzalover!'),
                            React.createElement(Text, { style: styles.profileSubtitle }, profile.phone || 'Seu próximo sabor favorito está aqui.'))),
                    React.createElement(View, { style: styles.profileSection },
                        React.createElement(Text, { style: styles.profileSectionTitle }, "\uD83D\uDCCD  Endere\u00E7o salvo"),
                        React.createElement(Text, { style: styles.profileAddress }, formatAddress(profile) || 'Nenhum endereço cadastrado ainda.'),
                        React.createElement(Pressable, { style: styles.outlineButton, onPress: () => setScreen('checkout') },
                            React.createElement(Text, { style: styles.outlineButtonText },
                                profile.street ? 'Editar endereço e dados' : 'Cadastrar endereço',
                                " \u2192"))),
                    React.createElement(View, { style: styles.profileSection },
                        React.createElement(Text, { style: styles.profileSectionTitle }, "\uD83D\uDD14  Notifica\u00E7\u00F5es de pedido"),
                        React.createElement(Text, { style: styles.profileSectionText }, "Receba avisos quando o pedido for confirmado, estiver sendo preparado e sair para entrega."),
                        React.createElement(Pressable, { style: styles.outlineButton, onPress: async () => { const result = await Notifications.requestPermissionsAsync(); Alert.alert(result.status === 'granted' ? 'Notificações ativadas' : 'Permissão não concedida', result.status === 'granted' ? 'Você receberá avisos de status neste dispositivo.' : 'Ative as notificações nas configurações do celular.'); } },
                            React.createElement(Text, { style: styles.outlineButtonText }, "Ativar notifica\u00E7\u00F5es \u2192"))),
                    React.createElement(View, { style: styles.demoInfo },
                        React.createElement(Text, { style: styles.demoInfoTitle }, '📱  Funcionamento local'),
                        React.createElement(Text, { style: styles.demoInfoText }, 'Cardápio, carrinho, endereço e pedidos ficam salvos somente neste aparelho. Não há conexão com backend, servidor ou API; as etapas do pedido são simuladas manualmente.')))))),
        !pageTitle && React.createElement(View, { style: styles.bottomNav }, ([
            { id: 'home', icon: '⌂', label: 'Início' },
            { id: 'builder', icon: '✳', label: 'Monte' },
            { id: 'orders', icon: '◷', label: 'Pedidos' },
            { id: 'profile', icon: '♡', label: 'Perfil' },
        ]).map((item) => React.createElement(Pressable, { key: item.id, onPress: () => setScreen(item.id), style: styles.navItem },
            React.createElement(Text, { style: [styles.navIcon, screen === item.id && styles.navIconActive] }, item.icon),
            React.createElement(Text, { style: [styles.navLabel, screen === item.id && styles.navLabelActive] }, item.label),
            screen === item.id && React.createElement(View, { style: styles.navIndicator })))),
        toast ? React.createElement(View, { style: styles.toast },
            React.createElement(Text, { style: styles.toastText },
                "\u2713  ",
                toast)) : null));
}
function MenuCard({ pizza, onAdd }) {
    return React.createElement(View, { style: styles.menuCard },
        React.createElement(View, { style: styles.menuCardArt },
            React.createElement(Text, { style: styles.menuCardEmoji }, pizza.emoji),
            pizza.tag ? React.createElement(View, { style: styles.menuTag },
                React.createElement(Text, { style: styles.menuTagText }, pizza.tag)) : null,
            React.createElement(View, { style: styles.menuArtBubble })),
        React.createElement(View, { style: styles.menuCardBody },
            React.createElement(Text, { numberOfLines: 1, style: styles.menuCardName }, pizza.name),
            React.createElement(Text, { numberOfLines: 2, style: styles.menuCardDescription }, pizza.description),
            React.createElement(View, { style: styles.menuCardFooter },
                React.createElement(View, null,
                    React.createElement(Text, { style: styles.fromLabel }, "A partir de"),
                    React.createElement(Text, { style: styles.menuCardPrice }, money(pizza.price))),
                React.createElement(Pressable, { style: styles.addButton, onPress: onAdd, accessibilityLabel: `Adicionar ${pizza.name}` },
                    React.createElement(Text, { style: styles.addButtonText }, "+")))));
}
function FormInput({ label, value, onChangeText, placeholder, keyboardType }) {
    return React.createElement(View, { style: styles.inputField },
        React.createElement(Text, { style: styles.inputLabel }, label),
        React.createElement(TextInput, { value: value, onChangeText: onChangeText, placeholder: placeholder, placeholderTextColor: "#B1A49A", keyboardType: keyboardType ?? 'default', style: styles.textInput, autoCapitalize: keyboardType === 'phone-pad' || keyboardType === 'number-pad' ? 'none' : 'words' }));
}
function SummaryLine({ label, value, green, strong }) {
    return React.createElement(View, { style: styles.summaryLine },
        React.createElement(Text, { style: [styles.summaryLabel, strong && styles.summaryStrong] }, label),
        React.createElement(Text, { style: [styles.summaryValue, green && styles.greenText, strong && styles.summaryStrong] }, value));
}
function EmptyState({ emoji, title, subtitle, actionLabel, onAction }) {
    return React.createElement(View, { style: styles.emptyState },
        React.createElement(View, { style: styles.emptyIllustration },
            React.createElement(Text, { style: styles.emptyEmoji }, emoji)),
        React.createElement(Text, { style: styles.emptyTitle }, title),
        React.createElement(Text, { style: styles.emptySubtitle }, subtitle),
        actionLabel && onAction ? React.createElement(Pressable, { onPress: onAction, style: styles.primaryButton },
            React.createElement(Text, { style: styles.primaryButtonText },
                actionLabel,
                " \u2192")) : null);
}
const styles = StyleSheet.create({
    flex: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: COLORS.cream },
    loadingScreen: { flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    header: { height: 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cream },
    brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoMark: { width: 43, height: 43, borderRadius: 15, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', transform: [{ rotate: '-4deg' }] },
    logoPi: { color: '#FFF9F1', fontSize: 30, fontWeight: '900', marginTop: -3 },
    logoDot: { color: '#F4BD6C', fontSize: 24, fontWeight: '900', marginLeft: -2, marginTop: 3 },
    brandName: { color: COLORS.ink, fontSize: 24, fontWeight: '900', letterSpacing: -1.2 },
    brandSubtitle: { color: COLORS.muted, fontSize: 8, letterSpacing: 1.5, fontWeight: '800', marginTop: -2 },
    cartButton: { width: 45, height: 45, borderRadius: 16, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
    cartIcon: { fontSize: 20 },
    cartBadge: { position: 'absolute', top: -5, right: -4, minWidth: 19, height: 19, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.red, borderWidth: 2, borderColor: COLORS.cream },
    cartBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
    subHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 8, gap: 12 },
    backButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', borderColor: COLORS.line, borderWidth: 1 },
    backButtonText: { fontSize: 28, color: COLORS.ink, lineHeight: 29 },
    subHeaderTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '800' },
    pageContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
    addressStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: COLORS.paper, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
    pinIcon: { fontSize: 26, color: COLORS.red, fontWeight: '800', width: 24, textAlign: 'center' },
    addressStripText: { flex: 1 },
    addressEyebrow: { fontSize: 9, letterSpacing: 1.2, color: COLORS.muted, fontWeight: '800' },
    addressMain: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 2 },
    chevron: { fontSize: 24, color: COLORS.muted, marginTop: -2 },
    hero: { borderRadius: 25, minHeight: 265, backgroundColor: COLORS.redDark, overflow: 'hidden', padding: 22, marginBottom: 27, position: 'relative' },
    heroCopy: { width: '76%', zIndex: 2 },
    heroPill: { alignSelf: 'flex-start', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#B34030', marginBottom: 13 },
    heroPillText: { color: '#FFE4C6', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    heroTitle: { color: '#FFF7EA', fontSize: 31, lineHeight: 33, fontWeight: '900', letterSpacing: -1.2 },
    heroDescription: { color: '#F7D7C8', fontSize: 11, lineHeight: 16, marginTop: 10, maxWidth: 205 },
    heroButton: { alignSelf: 'flex-start', backgroundColor: '#FFF4E5', paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12, marginTop: 17 },
    heroButtonText: { color: COLORS.redDark, fontWeight: '900', fontSize: 11 },
    heroArrow: { fontSize: 15 },
    heroPizza: { position: 'absolute', right: -25, bottom: 9, width: 154, height: 154, borderRadius: 77, backgroundColor: '#D5543B', borderColor: '#E9784B', borderWidth: 8, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-13deg' }] },
    heroPizzaEmoji: { fontSize: 80 },
    heroSparkle: { position: 'absolute', right: 35, top: -8, height: 31, width: 31, borderRadius: 16, backgroundColor: '#F5C66D', alignItems: 'center', justifyContent: 'center' },
    heroSparkleText: { color: COLORS.red },
    heroCircle: { position: 'absolute', right: -15, top: -25, width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#B84A37' },
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
    eyebrow: { fontSize: 9, letterSpacing: 1.7, color: COLORS.red, fontWeight: '900', marginBottom: 6 },
    sectionTitle: { color: COLORS.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.7 },
    headingEmoji: { fontSize: 29, color: COLORS.red, fontWeight: '300' },
    searchBox: { height: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderRadius: 15, borderColor: COLORS.line, borderWidth: 1, backgroundColor: COLORS.paper },
    searchIcon: { color: COLORS.red, fontSize: 25, width: 29, textAlign: 'center' },
    searchInput: { flex: 1, fontSize: 12, color: COLORS.ink },
    categoryRow: { gap: 8, paddingVertical: 16 },
    categoryPill: { borderRadius: 12, backgroundColor: '#F4EAE0', paddingHorizontal: 16, paddingVertical: 10 },
    categoryPillActive: { backgroundColor: COLORS.red },
    categoryText: { color: COLORS.muted, fontSize: 11, fontWeight: '800' },
    categoryTextActive: { color: '#FFFFFF' },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13 },
    menuCard: { width: '48.2%', overflow: 'hidden', borderRadius: 18, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line },
    menuCardArt: { height: 112, backgroundColor: '#F9EBDD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
    menuCardEmoji: { fontSize: 63, zIndex: 1 },
    menuTag: { position: 'absolute', top: 9, left: 8, zIndex: 2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: '#FFF8EC' },
    menuTagText: { color: COLORS.red, fontSize: 8, fontWeight: '900' },
    menuArtBubble: { position: 'absolute', bottom: -25, right: -20, borderRadius: 50, width: 95, height: 95, backgroundColor: '#F0D5B6', opacity: 0.55 },
    menuCardBody: { paddingHorizontal: 11, paddingTop: 11, paddingBottom: 12 },
    menuCardName: { fontSize: 13, fontWeight: '900', color: COLORS.ink },
    menuCardDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 15, height: 31, marginTop: 5 },
    menuCardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 11 },
    fromLabel: { color: '#A99A8E', fontSize: 8, fontWeight: '700' },
    menuCardPrice: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
    addButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: '500', marginTop: -2 },
    customBanner: { marginTop: 23, padding: 14, borderRadius: 18, backgroundColor: '#F1E6D8', flexDirection: 'row', alignItems: 'center', gap: 12 },
    customBannerIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#FFFAF2', alignItems: 'center', justifyContent: 'center' },
    customBannerCopy: { flex: 1 },
    customBannerTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
    customBannerText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
    customBannerArrow: { color: COLORS.red, fontSize: 22, fontWeight: '700' },
    builderIntro: { marginBottom: 22 },
    screenTitle: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
    bodyText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginBottom: 18 },
    fieldLabel: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginBottom: 11, marginTop: 12 },
    sizeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 9, marginBottom: 15 },
    sizeCard: { flex: 1, alignItems: 'center', borderRadius: 15, backgroundColor: COLORS.paper, borderWidth: 1.5, borderColor: COLORS.line, paddingVertical: 13 },
    sizeCardActive: { backgroundColor: COLORS.softRed, borderColor: COLORS.red },
    sizeEmoji: { fontSize: 20, marginBottom: 5 },
    sizeName: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
    sizeNameActive: { color: COLORS.red },
    sizePrice: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
    ingredientSection: { borderRadius: 18, backgroundColor: COLORS.paper, borderColor: COLORS.line, borderWidth: 1, padding: 14, marginTop: 12 },
    ingredientHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 5 },
    ingredientTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '900' },
    ingredientSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
    ingredientSelected: { color: COLORS.red, fontSize: 9, fontWeight: '800' },
    optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    ingredientChip: { paddingHorizontal: 9, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, backgroundColor: '#FBF7F2', borderWidth: 1, borderColor: COLORS.line, maxWidth: '100%' },
    ingredientChipActive: { backgroundColor: COLORS.softRed, borderColor: '#D86A5C' },
    ingredientCheck: { width: 16, height: 16, lineHeight: 15, textAlign: 'center', fontSize: 12, fontWeight: '900', color: COLORS.muted, borderRadius: 8, backgroundColor: '#EEE2D7', overflow: 'hidden' },
    ingredientCheckActive: { color: '#FFFFFF', backgroundColor: COLORS.red },
    ingredientLabel: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
    ingredientLabelActive: { color: COLORS.redDark },
    ingredientPrice: { color: COLORS.muted, fontSize: 9 },
    priceSummary: { backgroundColor: '#F2E7D9', borderRadius: 18, marginTop: 19, marginBottom: 10, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    priceSummaryLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
    priceSummaryValue: { color: COLORS.ink, fontSize: 21, fontWeight: '900', marginTop: 3 },
    primaryButton: { backgroundColor: COLORS.red, borderRadius: 13, paddingHorizontal: 17, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 55, paddingBottom: 42 },
    emptyIllustration: { width: 100, height: 100, borderRadius: 34, backgroundColor: '#F1E4D4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '900', textAlign: 'center' },
    emptySubtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8, marginBottom: 18 },
    cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderColor: COLORS.line, borderWidth: 1, borderRadius: 16, padding: 10, marginTop: 11, gap: 10 },
    pizzaThumb: { width: 62, height: 62, borderRadius: 15, backgroundColor: '#F8E9D8', alignItems: 'center', justifyContent: 'center' },
    pizzaThumbEmoji: { fontSize: 36 },
    cartItemCopy: { flex: 1 },
    cartItemName: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
    cartItemDescription: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
    cartItemPrice: { color: COLORS.red, fontSize: 12, fontWeight: '900', marginTop: 5 },
    quantityControl: { alignItems: 'center', gap: 7 },
    quantityButton: { width: 25, height: 25, borderRadius: 8, backgroundColor: '#F7EDE2', alignItems: 'center', justifyContent: 'center' },
    quantityButtonText: { color: COLORS.red, fontSize: 19, lineHeight: 21, fontWeight: '700' },
    quantityNumber: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
    summaryCard: { padding: 16, marginTop: 18, borderRadius: 17, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line },
    summaryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5 },
    summaryLabel: { color: COLORS.muted, fontSize: 12 },
    summaryValue: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
    summaryStrong: { color: COLORS.ink, fontSize: 16, fontWeight: '900' },
    greenText: { color: COLORS.green },
    shippingHint: { color: COLORS.green, fontSize: 10, marginTop: 7 },
    summaryDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 10 },
    checkoutButton: { backgroundColor: COLORS.red, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 17 },
    checkoutButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
    checkoutArrow: { fontSize: 17 },
    linkButton: { alignItems: 'center', paddingVertical: 16 },
    linkButtonText: { color: COLORS.red, fontWeight: '800', fontSize: 12 },
    checkoutIntro: { marginTop: 4, marginBottom: 6 },
    locationButton: { backgroundColor: COLORS.softGreen, borderColor: '#D4E9D9', borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    disabledButton: { opacity: 0.7 },
    locationButtonIcon: { color: COLORS.green, fontSize: 27, width: 30, textAlign: 'center' },
    locationButtonCopy: { flex: 1 },
    locationButtonTitle: { color: COLORS.green, fontSize: 12, fontWeight: '900' },
    locationButtonSubtitle: { color: '#608A70', fontSize: 10, marginTop: 3 },
    inputField: { marginBottom: 12 },
    inputLabel: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginBottom: 6 },
    textInput: { backgroundColor: COLORS.paper, borderColor: COLORS.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 12, color: COLORS.ink },
    formTwoColumns: { flexDirection: 'row', gap: 10 },
    formColumn: { flex: 1 },
    checkoutTotal: { marginTop: 8, backgroundColor: '#F2E7D9', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    checkoutTotalLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
    checkoutTotalValue: { color: COLORS.ink, fontSize: 22, fontWeight: '900' },
    checkoutFootnote: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12, marginBottom: 12 },
    orderCard: { backgroundColor: COLORS.paper, borderRadius: 19, borderColor: COLORS.line, borderWidth: 1, padding: 15, marginTop: 17 },
    orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
    orderNumber: { color: COLORS.ink, fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
    orderDate: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
    statusBadge: { backgroundColor: COLORS.softGreen, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, maxWidth: '54%' },
    statusBadgeText: { color: COLORS.green, fontSize: 9, fontWeight: '900', textAlign: 'center' },
    orderLine: { height: 1, backgroundColor: COLORS.line, marginVertical: 13 },
    orderItemLine: { color: COLORS.ink, fontSize: 11, fontWeight: '700', marginBottom: 5 },
    orderMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 9, alignItems: 'flex-start' },
    orderMetaLabel: { color: COLORS.muted, fontSize: 10 },
    orderMetaValue: { color: COLORS.ink, fontSize: 10, fontWeight: '700', flex: 1, textAlign: 'right' },
    orderTotal: { color: COLORS.red, fontSize: 13, fontWeight: '900' },
    timeline: { marginTop: 20, marginBottom: 6 },
    timelineRow: { minHeight: 52, flexDirection: 'row', gap: 11 },
    timelineRail: { width: 22, alignItems: 'center', position: 'relative' },
    timelineDot: { zIndex: 2, width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: '#DED3C8', backgroundColor: '#FFFDF9', alignItems: 'center', justifyContent: 'center' },
    timelineDotDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
    timelineDotCurrent: { borderColor: COLORS.green, borderWidth: 3 },
    timelineDotText: { color: 'transparent', fontSize: 10, fontWeight: '900' },
    timelineDotTextDone: { color: '#FFFFFF' },
    timelineTopLine: { position: 'absolute', width: 2, top: -18, height: 18, backgroundColor: '#E6DBD0' },
    timelineBottomLine: { position: 'absolute', width: 2, top: 20, bottom: -2, backgroundColor: '#E6DBD0' },
    timelineLineDone: { backgroundColor: COLORS.green },
    timelineContent: { flex: 1, paddingBottom: 13 },
    timelineLabel: { color: '#A89A8F', fontSize: 11, fontWeight: '800' },
    timelineLabelCurrent: { color: COLORS.green },
    timelineDetail: { color: COLORS.muted, fontSize: 10, marginTop: 4, lineHeight: 14 },
    demoAdvanceButton: { alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderColor: '#E9C8BE', borderWidth: 1, backgroundColor: '#FFF7F2', marginTop: 8 },
    demoAdvanceText: { color: COLORS.red, fontWeight: '900', fontSize: 10 },
    liveOrderNote: { textAlign: 'center', color: COLORS.green, fontSize: 10, marginTop: 9 },
    profileHero: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#F0E4D6', borderRadius: 18, padding: 16, marginTop: 8, marginBottom: 18 },
    profileAvatar: { width: 54, height: 54, borderRadius: 20, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
    profileAvatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
    profileHeroCopy: { flex: 1 },
    profileName: { color: COLORS.ink, fontSize: 17, fontWeight: '900' },
    profileSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
    profileSection: { padding: 16, backgroundColor: COLORS.paper, borderColor: COLORS.line, borderWidth: 1, borderRadius: 17, marginBottom: 13 },
    profileSectionTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
    profileAddress: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
    profileSectionText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 9 },
    outlineButton: { marginTop: 13, borderRadius: 10, borderColor: '#E8D8CB', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
    outlineButtonText: { color: COLORS.red, fontSize: 11, fontWeight: '900' },
    demoInfo: { padding: 15, borderRadius: 16, backgroundColor: '#F4E9DC', marginTop: 3 },
    demoInfoTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
    demoInfoText: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 6 },
    bottomNav: { height: 73, backgroundColor: '#FFFCF8', borderTopColor: COLORS.line, borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 12 : 7 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
    navIcon: { fontSize: 22, fontWeight: '500', color: '#AA9B90' },
    navIconActive: { color: COLORS.red, fontWeight: '900' },
    navLabel: { color: '#A99B90', fontSize: 9, fontWeight: '700' },
    navLabelActive: { color: COLORS.red, fontWeight: '900' },
    navIndicator: { position: 'absolute', bottom: -6, width: 18, height: 3, borderRadius: 2, backgroundColor: COLORS.red },
    toast: { position: 'absolute', bottom: 86, left: 20, right: 20, backgroundColor: COLORS.ink, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 7 },
    toastText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' },
});


// Exibe um diagnóstico no lugar de uma tela totalmente branca caso ocorra
// um erro durante a renderização das telas do aplicativo.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro de renderização na πzzaria:', error, info && info.componentStack);
  }

  render() {
    if (this.state.error) {
      const message = this.state.error && this.state.error.message
        ? this.state.error.message
        : String(this.state.error);
      return React.createElement(
        SafeAreaView,
        { style: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFF9F1' } },
        React.createElement(Text, { style: { fontSize: 22, fontWeight: '900', color: '#C83B2B', marginBottom: 12 } }, 'Ops! A πzzaria encontrou um erro.'),
        React.createElement(Text, { style: { fontSize: 14, color: '#2A211C', marginBottom: 12, lineHeight: 21 } }, 'Reinicie o aplicativo. Se continuar, veja a mensagem abaixo e o terminal do Expo.'),
        React.createElement(Text, { selectable: true, style: { fontSize: 12, color: '#85766C', lineHeight: 18 } }, message)
      );
    }
    return React.createElement(PizzariaApp, this.props);
  }
}

// SafeAreaProvider precisa envolver toda a aplicação, inclusive a tela de erro.
function AppRoot() {
    return React.createElement(SafeAreaProvider, null,
        React.createElement(AppErrorBoundary, null));
}

export default AppRoot;
