export const default_categories = [
<<<<<<< HEAD
    "Data Structures and Algorithms", "Data Structures", "Algorithms", "Algorithm Technique", 
    "LeetCode Problems", 
    "LeetCode Problems > Arrays", 
    "LeetCode Problems > Two Pointers",
    "LeetCode Problems > Sliding Window",
    "LeetCode Problems > Linked List",
    "LeetCode Problems > Trees",
    "LeetCode Problems > Dynamic Programming",
    "LeetCode Problems > Backtracking",
=======
    "Data Structures and Algorithms", "Data Structures", "Algorithms", "Algorithm Technique", "LeetCode Problems",
>>>>>>> 0b403dd8fd2ea46c900943fddd73178a42abaf76
    "Backend Engineering", "Backend Engineering > Authentication", "Backend Engineering > Storage", "Backend Engineering > APIs", "Backend Engineering > Databases",
    "Frontend Engineering", "Frontend Engineering > React", "Frontend Engineering > Next.js", "Frontend Engineering > CSS",
    "Cloud Engineering", "Cloud Engineering > AWS", "DevOps",
    "JavaScript", "TypeScript", "Python", "System Design", "Machine Learning",
    "General", "Finance", "Finance > Investment", "Finance > Personal Finance", "Finance > Business Finance", "Finance > Stock Analysis",
    "Psychology", "Psychology > Behavioral", "Psychology > Cognitive",
    "Business", "Business > Strategy", "Business > Management", "Business > Marketing",
    "Health", "Health > Nutrition", "Health > Fitness",
    "Education", "Education > Learning Methods",
    "Science", "Science > Physics", "Science > Biology",
    "Philosophy", "History", "Politics", "Economics", "Arts", "Literature", "Travel", "Lifestyle", "Miscellaneous"
];

export const getStructuredCategories = () => {
    const structured: { [key: string]: string[] } = {};
    for (const cat of default_categories) {
        const parts = cat.split(' > ').map(p => p.trim());
        const main_cat = parts[0];
        if (!structured[main_cat]) {
            structured[main_cat] = [];
        }
        
        if (parts.length > 1) {
            const sub_cat = parts[1];
            if (!structured[main_cat].includes(sub_cat)) {
                structured[main_cat].push(sub_cat);
            }
        }
    }
    return structured;
}; 