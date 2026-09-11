import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Container = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View 
      className={styles.container}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </View>
  );
};

Container.displayName = 'Container';

const styles = {
  container: 'flex flex-1 m-6',
};
