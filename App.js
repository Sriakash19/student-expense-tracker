import React, {useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY='@student_expense_tracker';
const CATEGORIES=['Food','Travel','Education','Shopping','Bills','Other'];

export default function App(){
  const [items,setItems]=useState([]);
  const [ready,setReady]=useState(false);
  const [visible,setVisible]=useState(false);
  const [type,setType]=useState('Expense');
  const [title,setTitle]=useState('');
  const [amount,setAmount]=useState('');
  const [category,setCategory]=useState('Food');
  const [filter,setFilter]=useState('All');

  useEffect(()=>{(async()=>{try{const saved=await AsyncStorage.getItem(KEY);if(saved)setItems(JSON.parse(saved));}catch(e){Alert.alert('Error','Could not load saved transactions.')}finally{setReady(true)}})()},[]);
  useEffect(()=>{if(ready)AsyncStorage.setItem(KEY,JSON.stringify(items)).catch(()=>{})},[items,ready]);

  const totals=useMemo(()=>{
    const income=items.filter(x=>x.type==='Income').reduce((s,x)=>s+x.amount,0);
    const expense=items.filter(x=>x.type==='Expense').reduce((s,x)=>s+x.amount,0);
    return {income,expense,balance:income-expense};
  },[items]);
  const money=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
  const openForm=t=>{setType(t);setTitle('');setAmount('');setCategory('Food');setVisible(true)};
  const save=()=>{
    const n=Number(amount);
    if(!title.trim())return Alert.alert('Enter a name','Please add a transaction name.');
    if(!amount.trim()||!Number.isFinite(n)||n<=0)return Alert.alert('Invalid amount','Enter an amount greater than zero.');
    setItems(old=>[{id:Date.now().toString()+Math.random(),title:title.trim(),amount:n,type,category,date:new Date().toISOString()},...old]);
    setVisible(false);
  };
  const remove=id=>Alert.alert('Delete transaction?','This action cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setItems(old=>old.filter(x=>x.id!==id))}]);
  const shown=items.filter(x=>filter==='All'||x.type===filter);
  const renderItem=({item})=><View style={s.transaction}>
    <View style={[s.symbol,{backgroundColor:item.type==='Income'?'#DDF8E9':'#FFF0E7'}]}><Text style={{fontSize:23,color:item.type==='Income'?'#15945A':'#D65B4A'}}>{item.type==='Income'?'+':'−'}</Text></View>
    <View style={{flex:1}}><Text style={s.itemTitle}>{item.title}</Text><Text style={s.meta}>{item.category} · {new Date(item.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</Text></View>
    <View style={{alignItems:'flex-end'}}><Text style={{fontWeight:'800',color:item.type==='Income'?'#15945A':'#D65B4A'}}>{item.type==='Income'?'+':'−'}{money(item.amount)}</Text><TouchableOpacity onPress={()=>remove(item.id)}><Text style={s.delete}>Delete</Text></TouchableOpacity></View>
  </View>;

  return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor="#F5F7FB"/>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <View style={s.header}><View><Text style={s.eyebrow}>PERSONAL FINANCE</Text><Text style={s.heading}>Student Expense Tracker</Text><Text style={s.sub}>Keep your money in check.</Text></View><View style={s.logo}><Text style={s.logoText}>₹</Text></View></View>
        <View style={s.balance}><Text style={s.balanceLabel}>Available balance</Text><Text style={s.balanceValue}>{money(totals.balance)}</Text><View style={s.line}/><View style={s.row}><View style={{flex:1}}><Text style={s.miniLabel}>Income</Text><Text style={s.income}>↗ {money(totals.income)}</Text></View><View style={{flex:1}}><Text style={s.miniLabel}>Expenses</Text><Text style={s.expense}>↘ {money(totals.expense)}</Text></View></View></View>
        <Text style={s.section}>Quick actions</Text>
        <View style={s.row}><TouchableOpacity style={s.action} onPress={()=>openForm('Expense')}><Text style={s.actionSign}>−</Text><Text style={s.actionText}>Add expense</Text></TouchableOpacity><TouchableOpacity style={[s.action,{backgroundColor:'#E2F8EB'}]} onPress={()=>openForm('Income')}><Text style={s.actionSign}>+</Text><Text style={s.actionText}>Add income</Text></TouchableOpacity></View>
        <View style={[s.row,{marginTop:27,marginBottom:13,alignItems:'center'}]}><Text style={s.section}>Recent transactions</Text><Text style={s.count}>{items.length} total</Text></View>
        <View style={[s.row,{gap:8,marginBottom:14}]}>{['All','Expense','Income'].map(x=><TouchableOpacity key={x} onPress={()=>setFilter(x)} style={[s.chip,filter===x&&s.chipOn]}><Text style={[s.chipText,filter===x&&{color:'#FFF'}]}>{x}</Text></TouchableOpacity>)}</View>
        {shown.length?<FlatList data={shown} renderItem={renderItem} keyExtractor={x=>x.id} scrollEnabled={false} contentContainerStyle={{gap:10}}/>:<View style={s.empty}><Text style={{fontSize:30,marginBottom:10}}>🧾</Text><Text style={s.emptyTitle}>No transactions yet</Text><Text style={s.emptyText}>Add your first income or expense to start tracking your money.</Text></View>}
        <Text style={s.footer}>Your transactions are saved on this device.</Text>
      </ScrollView>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>setVisible(false)}><View style={s.backdrop}><View style={s.modal}>
        <View style={[s.row,{justifyContent:'space-between',alignItems:'center',marginBottom:15}]}><Text style={s.modalTitle}>Add {type.toLowerCase()}</Text><TouchableOpacity onPress={()=>setVisible(false)}><Text style={{fontSize:20,color:'#64748B'}}>✕</Text></TouchableOpacity></View>
        <Text style={s.label}>Transaction name</Text><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Lunch or Bus pass" placeholderTextColor="#98A2B3" maxLength={60}/>
        <Text style={s.label}>Amount (₹)</Text><TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#98A2B3"/>
        <Text style={s.label}>Category</Text><View style={[s.row,{flexWrap:'wrap',gap:8,marginTop:3,marginBottom:20}]}>{CATEGORIES.map(x=><TouchableOpacity key={x} onPress={()=>setCategory(x)} style={[s.cat,category===x&&s.catOn]}><Text style={{fontSize:11,color:category===x?'#2458C6':'#657087',fontWeight:'700'}}>{x}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={s.save} onPress={save}><Text style={{color:'#FFF',fontWeight:'800'}}>Save transaction</Text></TouchableOpacity>
      </View></View></Modal>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#F5F7FB'},page:{padding:20,paddingBottom:35},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:10,marginBottom:22},
 eyebrow:{color:'#64748B',fontSize:10,fontWeight:'800',letterSpacing:1.8,marginBottom:7},
 heading:{fontSize:24,fontWeight:'800',color:'#172033',letterSpacing:-.5},sub:{color:'#7A8497',marginTop:6,fontSize:13},
 logo:{width:48,height:48,borderRadius:16,backgroundColor:'#DCEAFE',alignItems:'center',justifyContent:'center'},logoText:{color:'#2458C6',fontSize:25,fontWeight:'800'},
 balance:{backgroundColor:'#1E3A8A',borderRadius:24,padding:22,marginBottom:26},balanceLabel:{color:'#CBD8F8',fontSize:13,fontWeight:'600'},balanceValue:{color:'#FFF',fontSize:34,fontWeight:'800',marginTop:8},
 line:{height:1,backgroundColor:'#4962A5',marginVertical:20},row:{flexDirection:'row',gap:12},miniLabel:{color:'#C4D0F0',fontSize:12,marginBottom:7},income:{color:'#9AF0C0',fontSize:15,fontWeight:'700'},expense:{color:'#FFD0D0',fontSize:15,fontWeight:'700'},
 section:{fontSize:17,fontWeight:'800',color:'#172033',marginBottom:13},action:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#FFF',borderWidth:1,borderColor:'#E4E8F0',borderRadius:15,paddingVertical:14,gap:7},
 actionSign:{fontSize:21,fontWeight:'700',color:'#2458C6'},actionText:{fontSize:13,fontWeight:'700',color:'#243047'},count:{fontSize:12,color:'#7A8497'},
 chip:{paddingHorizontal:15,paddingVertical:8,borderRadius:20,backgroundColor:'#E9EDF4'},chipOn:{backgroundColor:'#2458C6'},chipText:{fontSize:12,color:'#657087',fontWeight:'700'},
 transaction:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',padding:13,borderRadius:16,borderWidth:1,borderColor:'#EDF0F5'},
 symbol:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',marginRight:12},itemTitle:{color:'#202B40',fontSize:14,fontWeight:'700'},meta:{color:'#8A94A6',fontSize:11,marginTop:5},delete:{color:'#9AA3B2',fontSize:10,marginTop:5},
 empty:{alignItems:'center',padding:27,backgroundColor:'#FFF',borderRadius:18,borderWidth:1,borderColor:'#EDF0F5'},emptyTitle:{fontSize:15,fontWeight:'800',color:'#253047'},emptyText:{color:'#8993A5',textAlign:'center',fontSize:12,lineHeight:18,marginTop:7},
 footer:{color:'#9AA3B2',fontSize:11,textAlign:'center',marginTop:22},backdrop:{flex:1,backgroundColor:'rgba(16,24,40,0.48)',justifyContent:'flex-end'},modal:{backgroundColor:'#FFF',borderTopLeftRadius:26,borderTopRightRadius:26,padding:22,paddingBottom:30},
 modalTitle:{color:'#172033',fontSize:22,fontWeight:'800',textTransform:'capitalize'},label:{color:'#344054',fontSize:12,fontWeight:'700',marginBottom:8,marginTop:8},input:{backgroundColor:'#F7F8FB',borderWidth:1,borderColor:'#E3E7EF',borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:14,color:'#172033'},
 cat:{paddingHorizontal:12,paddingVertical:9,borderRadius:18,backgroundColor:'#F0F2F7',borderWidth:1,borderColor:'#F0F2F7'},catOn:{backgroundColor:'#E4ECFF',borderColor:'#9DB9FF'},save:{backgroundColor:'#2458C6',borderRadius:14,paddingVertical:15,alignItems:'center'}
});
