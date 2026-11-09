import { Colors } from './Colors';
import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
  block: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 14,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  separator: {
    // height:  StyleSheet.hairlineWidth,
    // backgroundColor: Colors.GRAY,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.lightGray,
    marginLeft: 50,
  },
});