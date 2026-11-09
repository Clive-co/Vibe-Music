import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ListRenderItemInfo } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface Item {
  id: number;
  text: string;
}

interface SwipeableListProps {
  data: Item[];
}

const SwipeableList: React.FC<SwipeableListProps> = ({ data }) => {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const swipeableRefs = useRef<(Swipeable | null)[]>([]);

  const renderRightActions = () => (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity onPress={() => console.log('Delete')}>
        <Text style={{ padding: 20, backgroundColor: 'red' }}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => console.log('Pin')}>
        <Text style={{ padding: 20, backgroundColor: 'blue' }}>Pin</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => console.log('Mute')}>
        <Text style={{ padding: 20, backgroundColor: 'green' }}>Mute</Text>
      </TouchableOpacity>
    </View>
  );

  const closeOpenItem = () => {
    if (openItem !== null && swipeableRefs.current[openItem]) {
      swipeableRefs.current[openItem]?.close();
    }
  };

  const handleSwipeableOpen = (index: number) => {
    closeOpenItem();
    setOpenItem(index);
  };

  const handleTapOutside = () => {
    closeOpenItem();
    setOpenItem(null);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<Item>) => (
    <Swipeable
      ref={(ref) => (swipeableRefs.current[index] = ref)}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => handleSwipeableOpen(index)}
    >
      <View style={{ padding: 20, borderBottomWidth: 1, borderColor: '#ccc' }}>
        <Text>{item.text}</Text>
      </View>
    </Swipeable>
  );

  return (
    <TouchableOpacity activeOpacity={1} onPress={handleTapOutside} style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </TouchableOpacity>
  );
};

export default SwipeableList;