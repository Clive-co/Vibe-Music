
import { useActiveColors } from "@/constants/ThemeMode";
import { useTheme } from "@/constants/ThemeProvider";
import { useColorScheme, View, Text, ScrollView, Dimensions, Platform } from "react-native";
import Skeleton from "./Skeleton";



export const LoadingRecents = () => {

  const activeColors = useActiveColors()

 const {mode} = useTheme()
 const colorMode = mode === 'dark' ? 'dark' : 'light';
  const isDark = useColorScheme() === 'dark';
    return(
      <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: activeColors.text }}>Recents</Text>
                <Text style={{ fontWeight: '600', fontSize: 13, color: activeColors.text }}>See more</Text>
              </View>
      <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 15,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, width: '65%', }}>
                <Skeleton width={50} height={50} 
                />

                <View style={{ justifyContent: 'space-evenly', flex: 1, }}>
                  <Skeleton borderRadius={99} height={13}  width={'100%'}/>
                  <Skeleton   borderRadius={99}  height={13}  width={'50%'}/>
                </View>
              </View>
            </View>

             <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 15,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, width: '65%', }}>
                <Skeleton width={50} height={50} 
                />

                <View style={{ justifyContent: 'space-evenly', flex: 1, }}>
                  <Skeleton borderRadius={99} height={13}  width={'100%'}/>
                  <Skeleton   borderRadius={99}  height={13}  width={'50%'}/>
                </View>
              </View>
            </View>

             <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 15,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, width: '65%', }}>
                <Skeleton width={50} height={50}
                />

                <View style={{ justifyContent: 'space-evenly', flex: 1, }}>
                  <Skeleton borderRadius={99} height={13}  width={'100%'}/>
                  <Skeleton   borderRadius={99}  height={13}  width={'50%'}/>
                </View>
              </View>
            </View>
            </>
    )
  }


export const LoadingArtists = () => {
  const activeColors = useActiveColors()
  const isDark = useColorScheme() === 'dark';
  return (
     <View style={{width: '100%', alignItems: 'center', marginTop: 30,}}>
          <Text style={{fontWeight: '500', fontSize: 20, color: activeColors.text,}}>Top Artists</Text>
    
    <ScrollView
    style={{marginTop: 20, }}
horizontal
scrollEnabled={false}
bounces={false}
showsHorizontalScrollIndicator={false}
contentContainerStyle={{gap: 10, paddingHorizontal: 10,}} 
    >
     <View style={{alignItems: 'center', gap: 8, width: 95,}}>
                <Skeleton  borderRadius={40} width={95} height={103} />
                <Skeleton borderRadius={99} height={13}  width={'80%'}/>
            </View>

            <View style={{alignItems: 'center', gap: 8, width: 95,}}>
                <Skeleton  borderRadius={40} width={95} height={103} />
                <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            </View>

            <View style={{alignItems: 'center', gap: 8, width: 95,}}>
                <Skeleton  borderRadius={40} width={95} height={103} />
                <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            </View>

            <View style={{alignItems: 'center', gap: 8, width: 95,}}>
                <Skeleton  borderRadius={40} width={95} height={103} />
                <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            </View>
            </ScrollView>
            </View>
  )
}


export const LoadingTracks = () => {
  const activeColors = useActiveColors()
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={{width: '100%', alignItems: 'center', marginTop: 30,}}>
            <Text style={{fontWeight: '500', fontSize: 20, color: activeColors.text,}}>Top Tracks</Text>
    
            <ScrollView
    style={{marginTop: 20, }}
    horizontal
    bounces={false}
    scrollEnabled={false}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{gap: 13, paddingHorizontal: 10,}}
    >
      
            <View style={{alignItems: 'center', gap: 8, width: 95,}}>
            <Skeleton  width={95} height={103} borderRadius={10}/>
            <View style={{width: '100%', alignItems: 'center', gap: 4,}}>
            <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            <Skeleton  borderRadius={99} height={13}  width={'50%'}/>
            </View>    
        </View>

         <View style={{alignItems: 'center', gap: 8, width: 95,}}>
            <Skeleton  width={95} height={103} borderRadius={10}/>
            <View style={{width: '100%', alignItems: 'center', gap: 4,}}>
            <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            <Skeleton  borderRadius={99} height={13}  width={'50%'}/>
            </View>    
        </View>

         <View style={{alignItems: 'center', gap: 8, width: 95,}}>
            <Skeleton  width={95} height={103} borderRadius={10}/>
            <View style={{width: '100%', alignItems: 'center', gap: 4,}}>
            <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            <Skeleton  borderRadius={99} height={13}  width={'50%'}/>
            </View>    
        </View>

         <View style={{alignItems: 'center', gap: 8, width: 95,}}>
            <Skeleton  width={95} height={103} borderRadius={10}/>
            <View style={{width: '100%', alignItems: 'center', gap: 4,}}>
            <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
            <Skeleton  borderRadius={99} height={13} width={'50%'}/>
            </View>    
        </View>
    </ScrollView>
        </View>
  )
}

export const TopThreeSkeleton = () => {

  const isDark = useColorScheme() === 'dark';
  return(
  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
              <View style={{alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth: 70,}}>
                <View className="" 
                style={{
                  shadowOpacity: 0.5, 
                  shadowOffset: {
                    height: 4, 
                    width: 0,
                  }, 
                  elevation: 2,
                  }}>
                  <Skeleton  borderRadius={99} width={70} height={70}/>
                  </View>
                   <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                   <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                  {/* <Text style={{color: activeColors.text,}}>{rank}</Text> */}
              </View>

              <View style={{alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth: 90,}}>
                <View className="" 
                style={{
                  shadowOpacity: 0.5, 
                  shadowOffset: {
                    height: 4, 
                    width: 0,
                  }, 
                  elevation: 2,
                  }}>
                  <Skeleton  borderRadius={99} width={90} height={90}/>
                  </View>
                  <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                  <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                  {/* <Text style={{color: activeColors.text,}}>{rank}</Text> */}
              </View>

              <View style={{alignItems: 'center', justifyContent: 'center', gap: 5, maxWidth:  70 }}>
                <View className="" 
                style={{
                  shadowOpacity: 0.5, 
                  shadowOffset: {
                    height: 4, 
                    width: 0,
                  }, 
                  elevation: 2,
                  }}>
                  <Skeleton   borderRadius={99} width={70} height={70}/>
                  </View>
                  <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                  <Skeleton  borderRadius={99} height={13}  width={'80%'}/>
                  {/* <Text style={{color: activeColors.text,}}>{rank}</Text> */}
              </View>
          
        </View>
        )
}

export const MyRankSkeleton = () => {
  const isDark =useColorScheme() === 'dark'

  return(
    
            <Skeleton borderRadius={99} width={'100%'} height={40} />
          
  )
}

export const LeaderboardSkeleton = () => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={{ gap: 20, flex: 1, width: '100%',}}>
     <Skeleton borderRadius={16} width={'100%'} height={50} />
      <Skeleton borderRadius={16} width={'100%'} height={50} />
       <Skeleton borderRadius={16} width={'100%'} height={50} />
        <Skeleton borderRadius={16} width={'100%'} height={50} />
        </View>
  )
}

export const FriendActivitySkeleton = () => {

  const { width, height } = Dimensions.get("screen");
  const isDark = useColorScheme() === 'dark';

  return(
  <View style={{flex: 1, justifyContent: 'center', }}>
    <View style={{height: '55%', alignSelf: 'center',}}>
  <View
        style={{
          //backgroundColor: 'green',
          alignItems: "center",
          height: "87%",
          //flex: 1,
          gap: 15,
        }}
      >
        <View
          style={{
            //flex: 1,
            // backgroundColor: 'red',
            width,
            //height: '80%',
            //justifyContent: 'center',
            alignItems: "center",
            flexDirection: "column",
            margin: 0,
            
          }}
        >
          <Skeleton
          width={'80%'}
          height={"100%"}
          borderRadius={20}
          />

        </View>

        <Skeleton
        width={'30%'}
        borderRadius={99}
        height={25}
        
        />
      </View>
      </View>
      </View>
    )
}

export const UserFriendLoadingSkeleton = () => {
  return(
    <View style={{flex:1, paddingTop: 20, gap: 25, paddingHorizontal: 20,}}>
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>
    </View>

     <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>
    </View>


    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>

    </View>

    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>
    </View>

    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>
    </View>

    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
                  <Skeleton
                  style={{width: 40, height: 40, borderRadius: 99,}}
                  />
                  <Skeleton  borderRadius={99} height={13}  width={'70%'}/>
                  </View>
    </View>

    </View>
  )
}