import {
Box,
Button,
Menu,
MenuButton,
MenuItem,
MenuList,
Text,
} from "@chakra-ui/react";
import { LANGUAGE_VERSIONS } from "../constants";
const languages = Object.entries(LANGUAGE_VERSIONS);
const ACTIVE_COLOR = "blue.400";
const LanguageSelector = ({ language, onSelect }) => {
return (
<Box ml={2} mb={4}>
<Text mb={2} fontSize="lg" color="#00ffcc">
⚙ Language
</Text>
<Menu isLazy>
<MenuButton
as={Button}
bg="#00ffcc"
color="black"
_hover={{ bg: "#00e6b8" }}
_active={{ bg: "#00e6b8" }}
>
{/* ✅ Capitalization FIX */}
{language.charAt(0).toUpperCase() + language.slice(1)}
</MenuButton>
<MenuList bg="#110c1b">
{languages.map(([lang, version]) => (
<MenuItem
key={lang}
color={lang === language ? ACTIVE_COLOR : ""}
bg={lang === language ? "gray.900" : "transparent"}
transition="all 0.2s ease"
_hover={{
color: ACTIVE_COLOR,
bg: "gray.900",

transform: "scale(1.03)",
}}
onClick={() => onSelect(lang)}
>
{/* ✅ Icons */}
{lang === "javascript" && "🟡 "}
{lang === "python" && "🐍 "}
{lang === "html" && "🌐 "}
{lang === "css" && "🎨 "}
{lang}
&nbsp;
<Text as="span" color="gray.600" fontSize="sm">
({version})
</Text>
</MenuItem>
))}
</MenuList>
</Menu>
</Box>
);
};
export default LanguageSelector;