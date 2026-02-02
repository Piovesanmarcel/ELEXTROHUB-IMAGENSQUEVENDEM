// Kit Generator Types

export type KitMode = 'single_product' | 'multiple_products';

export type KitStyle =
    | 'professional'
    | 'lifestyle'
    | 'promotional'
    | 'luxury'
    | 'minimalist'
    | 'flat_lay'
    | 'gift_box';

export type KitLayout =
    | 'auto'
    | 'side_by_side'
    | 'stacked'
    | 'diagonal'
    | 'pyramid'
    | 'circular';

export interface ProductSlot {
    id: string;
    image: string | null;
    url: string;
}

export interface KitGenerationRequest {
    images: string[];
    kitDescription?: string;
    style: KitStyle;
    layout: KitLayout;
    sameProduct: boolean;
    apiKeyId?: string;
}

export interface SingleProductKitRequest {
    image: string;
    quantity: number;
    ctaText: string;
    style: KitStyle;
    layout: KitLayout;
    apiKeyId?: string;
}

// Multi-style batch generation result
export interface GeneratedKitResult {
    style: KitStyle;
    image: string;
    timestamp: number;
}

// Batch generation progress state
export interface BatchGenerationProgress {
    currentIndex: number;
    totalStyles: number;
    currentStyle: KitStyle;
    completed: GeneratedKitResult[];
}

export interface KitSuggestionResponse {
    suggestions: string[];
}

// Layout prompts for AI generation
export const layoutPrompts: Record<KitLayout, string> = {
    auto: `LAYOUT: AUTO (AI DECIDES)
- Position products in the most visually appealing arrangement
- Consider product shapes and sizes for optimal placement
- Create a balanced, professional composition`,

    side_by_side: `LAYOUT: SIDE BY SIDE
- Products arranged horizontally in a row
- Equal spacing between products
- All products at same baseline
- Symmetrical composition`,

    stacked: `LAYOUT: STACKED/OVERLAPPING
- Products slightly overlapping for depth
- Main product in front, others behind
- Creates 3D layered effect
- Front product most prominent`,

    diagonal: `LAYOUT: DIAGONAL DYNAMIC
- Products arranged in diagonal line
- Creates dynamic visual flow
- Size gradation from large to small
- Eye-catching composition`,

    pyramid: `LAYOUT: PYRAMID/HERO
- One main product larger in center/front
- Supporting products smaller around it
- Hero product takes 40% of space
- Others share remaining space`,

    circular: `LAYOUT: CIRCULAR/ORBITAL
- Products arranged in circular pattern
- Can have center product with orbiting items
- Balanced radial distribution
- Modern, dynamic feel`
};

// Style prompts for AI generation
export const stylePrompts: Record<KitStyle, string> = {
    professional: `STYLE: Professional Product Photography
- Pure white or light gradient background
- Studio lighting with soft shadows
- Products placed on reflective surface
- Clean, minimalist composition
- Commercial e-commerce quality`,

    lifestyle: `STYLE: Lifestyle Product Photography
- Natural environment setting appropriate for the products
- Warm, inviting lighting
- Products shown in realistic usage context
- Complementary props and textures
- Aspirational mood`,

    promotional: `STYLE: Promotional Kit Photography
- Dynamic, eye-catching composition
- Products at complementary angles
- Vibrant, energetic lighting
- Visual hierarchy emphasizing the kit value
- Premium bundle presentation`,

    luxury: `STYLE: Luxury Premium Photography
- Dark/black elegant background with subtle gradients
- Gold, silver or rose gold accent lighting
- Dramatic spotlight illumination
- Reflective surface creating mirror effect
- Luxurious, high-end atmosphere
- Subtle lens flare or bokeh effects
- Premium, exclusive brand feel`,

    minimalist: `STYLE: Minimalist Clean Photography
- Pure white or soft neutral background (beige, light gray)
- Maximum negative space (products use only 50-60% of image)
- NO badges, ribbons or promotional CTAs
- Ultra-clean, distraction-free composition
- Soft, even lighting without harsh shadows
- Contemporary, sophisticated aesthetic
- Focus purely on products themselves`,

    flat_lay: `STYLE: Flat Lay Top-Down Photography
- Camera angle: directly from above (90 degrees)
- Products arranged on flat surface
- Geometric, organized composition
- Complementary props around products (textures, fabrics)
- Even, diffused overhead lighting
- Instagram/Pinterest aesthetic
- Visually satisfying symmetry or pattern`,

    gift_box: `STYLE: Gift Box Presentation Photography
- Products displayed inside an open premium gift box
- Tissue paper, ribbons, or decorative elements
- Box slightly angled to show products
- Warm, festive lighting
- Gift-ready, unboxing experience feel
- Premium packaging presentation
- Perfect for seasonal promotions and gifts`
};

// Size distribution based on product count
export const getSizeDistribution = (count: number): string => {
    const distributions: Record<number, string> = {
        2: `- 2 products: 50/50 or 55/45 visual weight ratio
- Both products equally prominent`,
        3: `- 3 products: 40/35/25 or 35/35/30 visual weight ratio
- First product slightly larger, others balanced`,
        4: `- 4 products: 30/25/25/20 visual weight ratio
- Gradual size variation for visual flow`,
        5: `- 5 products: 25/20/20/20/15 visual weight ratio
- Main product 25%, others distributed evenly`
    };

    return distributions[count] || distributions[2];
};

// Layout metadata for UI
export interface LayoutOption {
    value: KitLayout;
    label: string;
    description: string;
    icon: 'auto' | 'columns' | 'layers' | 'arrow-up-right' | 'triangle' | 'circle';
}

export const layoutOptions: LayoutOption[] = [
    {
        value: 'auto',
        label: 'Automatico',
        description: 'IA escolhe o melhor arranjo',
        icon: 'auto'
    },
    {
        value: 'side_by_side',
        label: 'Lado a Lado',
        description: 'Produtos em linha horizontal',
        icon: 'columns'
    },
    {
        value: 'stacked',
        label: 'Empilhado',
        description: 'Sobreposicao com profundidade',
        icon: 'layers'
    },
    {
        value: 'diagonal',
        label: 'Diagonal',
        description: 'Disposicao dinamica em diagonal',
        icon: 'arrow-up-right'
    },
    {
        value: 'pyramid',
        label: 'Piramide',
        description: 'Produto destaque + secundarios',
        icon: 'triangle'
    },
    {
        value: 'circular',
        label: 'Circular',
        description: 'Arranjo orbital moderno',
        icon: 'circle'
    }
];
