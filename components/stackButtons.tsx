
import { useActiveColors } from "@/constants/ThemeMode"
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router"
import { TouchableOpacity } from "react-native"


export const ContactsButton = () => {
    const activeColors = useActiveColors();
    return(
        <Link href="/(modals)/new-interaction" asChild>
              <TouchableOpacity
              style={{width: 35, 
              height: 35, 
              borderRadius: 99, 
              backgroundColor: activeColors.buttonBackdrop,
               alignItems: 'center', 
               justifyContent: 'center',
      
              }}>
                <Ionicons name="create-outline" size={20} color={activeColors.colorText} />
              </TouchableOpacity>
              </Link>
    )
    
}