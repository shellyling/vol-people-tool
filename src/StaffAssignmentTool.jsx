import React, { useState, useEffect } from 'react';
import { Users, MapPin, Link, Shuffle, Download, Plus, Trash2, UserCheck } from 'lucide-react';
import defaultStaffList from './data/staffList.json';

const StaffAssignmentTool = () => {
  // 預設載入您的名單
  const [staff, setStaff] = useState(defaultStaffList);
  const [assignments, setAssignments] = useState({ venueA: [], venueB: [] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', gender: '', preference: '', bondedWith: '' });
  const [bonds, setBonds] = useState([]);
  
  // 新增場地設定
  const [venueSettings, setVenueSettings] = useState({
    venueA: { name: 'A場', maleCount: 9, femaleCount: 9, color: 'red' },
    venueB: { name: 'B場', maleCount: 9, femaleCount: 9, color: 'blue' }
  });
  const [showVenueConfig, setShowVenueConfig] = useState(false);

  // 檢查人員是否為綁定對象
  const getBondedPartner = (person) => {
    for (const bond of bonds) {
      if (bond[0].id === person.id) return bond[1];
      if (bond[1].id === person.id) return bond[0];
    }
    return null;
  };

  const addStaff = () => {
    if (!newStaff.name.trim()) return;
    
    const staffMember = {
      id: Date.now(),
      name: newStaff.name.trim(),
      gender: newStaff.gender,
      preference: newStaff.preference,
      bondedWith: newStaff.bondedWith ? newStaff.bondedWith.trim() : ''
    };
    
    setStaff([...staff, staffMember]);
    setNewStaff({ name: '', gender: '', preference: '', bondedWith: '' });
    setShowAddForm(false);
  };

  // 刪除人員
  const removeStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
    // 同時從分配中移除
    setAssignments({
      venueA: assignments.venueA.filter(s => s.id !== id),
      venueB: assignments.venueB.filter(s => s.id !== id)
    });
  };

  // 建立綁定關係
  const createBonds = () => {
    const bondPairs = [];
    const processed = new Set();
    
    staff.forEach(person => {
      if (person.bondedWith && !processed.has(person.id)) {
        const partner = staff.find(s => 
          s.name.toLowerCase() === person.bondedWith.toLowerCase() && 
          s.id !== person.id
        );
        if (partner) {
          bondPairs.push([person, partner]);
          processed.add(person.id);
          processed.add(partner.id);
        }
      }
    });
    
    setBonds(bondPairs);
    return bondPairs;
  };

  // 智能分配演算法
  const autoAssign = () => {
    const totalRequired = venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount + 
                          venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount;
    
    if (staff.length !== totalRequired) {
      alert(`請確保總人數為${totalRequired}人 (A場:${venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount}人, B場:${venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount}人)`);
      return;
    }

    const bondPairs = createBonds();
    const unbondedStaff = staff.filter(person => 
      !bondPairs.some(pair => pair.includes(person))
    );
    
    const males = staff.filter(s => s.gender === '男');
    const females = staff.filter(s => s.gender === '女');
    
    const totalMales = venueSettings.venueA.maleCount + venueSettings.venueB.maleCount;
    const totalFemales = venueSettings.venueA.femaleCount + venueSettings.venueB.femaleCount;
    
    if (males.length !== totalMales || females.length !== totalFemales) {
      alert(`請確保性別比例正確 (需要: 男${totalMales}人, 女${totalFemales}人；目前: 男${males.length}人, 女${females.length}人)`);
      return;
    }

    let venueA = [];
    let venueB = [];
    let assignedIds = new Set();

    // 1. 處理綁定對且有偏好的
    bondPairs.forEach(pair => {
      if (assignedIds.has(pair[0].id) || assignedIds.has(pair[1].id)) return;
      
      const preference = pair[0].preference === pair[1].preference ? pair[0].preference : '';
      const maxVenueA = venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount;
      const maxVenueB = venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount;
      
      if (preference === 'A' && venueA.length + 2 <= maxVenueA) {
        venueA.push(...pair);
        assignedIds.add(pair[0].id);
        assignedIds.add(pair[1].id);
      } else if (preference === 'B' && venueB.length <= maxVenueB - 2) {
        venueB.push(...pair);
        assignedIds.add(pair[0].id);
        assignedIds.add(pair[1].id);
      }
    });

    // 2. 處理有偏好的單人
    const preferenceA = unbondedStaff.filter(s => s.preference === 'A' && !assignedIds.has(s.id));
    const preferenceB = unbondedStaff.filter(s => s.preference === 'B' && !assignedIds.has(s.id));
    
    preferenceA.forEach(person => {
      const maxVenueA = venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount;
      if (venueA.length < maxVenueA) {
        venueA.push(person);
        assignedIds.add(person.id);
      }
    });
    
    preferenceB.forEach(person => {
      const maxVenueB = venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount;
      if (venueB.length < maxVenueB) {
        venueB.push(person);
        assignedIds.add(person.id);
      }
    });

    // 3. 處理剩餘的綁定對
    bondPairs.forEach(pair => {
      if (assignedIds.has(pair[0].id) || assignedIds.has(pair[1].id)) return;
      
      const maxVenueA = venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount;
      const maxVenueB = venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount;
      
      if (venueA.length <= maxVenueA - 2) {
        venueA.push(...pair);
        assignedIds.add(pair[0].id);
        assignedIds.add(pair[1].id);
      } else if (venueB.length <= maxVenueB - 2) {
        venueB.push(...pair);
        assignedIds.add(pair[0].id);
        assignedIds.add(pair[1].id);
      }
    });

    // 4. 分配剩餘人員，考慮性別平衡
    const remaining = staff.filter(s => !assignedIds.has(s.id));
    const remainingMales = remaining.filter(s => s.gender === '男');
    const remainingFemales = remaining.filter(s => s.gender === '女');
    
    const venueAMales = venueA.filter(s => s.gender === '男').length;
    const venueAFemales = venueA.filter(s => s.gender === '女').length;
    
    // 為場地A補充到指定的男女人數
    let maleIndex = 0, femaleIndex = 0;
    
    while (venueA.length < venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount) {
      const needMales = venueSettings.venueA.maleCount - venueA.filter(s => s.gender === '男').length;
      const needFemales = venueSettings.venueA.femaleCount - venueA.filter(s => s.gender === '女').length;
      
      if (needMales > 0 && maleIndex < remainingMales.length) {
        venueA.push(remainingMales[maleIndex]);
        assignedIds.add(remainingMales[maleIndex].id);
        maleIndex++;
      } else if (needFemales > 0 && femaleIndex < remainingFemales.length) {
        venueA.push(remainingFemales[femaleIndex]);
        assignedIds.add(remainingFemales[femaleIndex].id);
        femaleIndex++;
      } else {
        break;
      }
    }
    
    // 剩餘人員分配到場地B
    const finalRemaining = staff.filter(s => !assignedIds.has(s.id));
    venueB.push(...finalRemaining);

    setAssignments({ venueA, venueB });
  };

  // 手動移動人員
  const moveStaff = (staffMember, fromVenue, toVenue) => {
    const maxToVenue = venueSettings[toVenue].maleCount + venueSettings[toVenue].femaleCount;
    if (assignments[toVenue].length >= maxToVenue) {
      alert('目標場地已滿');
      return;
    }
    
    setAssignments({
      ...assignments,
      [fromVenue]: assignments[fromVenue].filter(s => s.id !== staffMember.id),
      [toVenue]: [...assignments[toVenue], staffMember]
    });
  };

  // 匯出結果
  const exportResults = () => {
    const results = {
      'A場地 (18人)': assignments.venueA.map(s => `${s.name} (${s.gender})`),
      'B場地 (18人)': assignments.venueB.map(s => `${s.name} (${s.gender})`)
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '人員分配結果.json';
    link.click();
  };

  // 統計資訊
  const getStats = (venue) => {
    const males = venue.filter(s => s.gender === '男').length;
    const females = venue.filter(s => s.gender === '女').length;
    return { males, females, total: venue.length };
  };

  useEffect(() => {
    createBonds();
  }, [staff]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="mr-3 text-blue-600" />
          智能人員分配工具
        </h1>
        <p className="text-gray-600">管理36人分配到A、B兩個場地，支援綁定關係、偏好設定和性別平衡</p>
      </div>

      {/* 場地設定區域 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">場地設定</h2>
          <button
            onClick={() => setShowVenueConfig(!showVenueConfig)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            {showVenueConfig ? '收起設定' : '場地設定'}
          </button>
        </div>

        {showVenueConfig && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* A場設定 */}
              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-700 mb-3">A場設定</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">場地名稱</label>
                    <input
                      type="text"
                      value={venueSettings.venueA.name}
                      onChange={(e) => setVenueSettings({
                        ...venueSettings,
                        venueA: { ...venueSettings.venueA, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">男生人數</label>
                      <input
                        type="number"
                        min="0"
                        value={venueSettings.venueA.maleCount}
                        onChange={(e) => setVenueSettings({
                          ...venueSettings,
                          venueA: { ...venueSettings.venueA, maleCount: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">女生人數</label>
                      <input
                        type="number"
                        min="0"
                        value={venueSettings.venueA.femaleCount}
                        onChange={(e) => setVenueSettings({
                          ...venueSettings,
                          venueA: { ...venueSettings.venueA, femaleCount: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    總人數: {venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount}人
                  </div>
                </div>
              </div>

              {/* B場設定 */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-700 mb-3">B場設定</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">場地名稱</label>
                    <input
                      type="text"
                      value={venueSettings.venueB.name}
                      onChange={(e) => setVenueSettings({
                        ...venueSettings,
                        venueB: { ...venueSettings.venueB, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">男生人數</label>
                      <input
                        type="number"
                        min="0"
                        value={venueSettings.venueB.maleCount}
                        onChange={(e) => setVenueSettings({
                          ...venueSettings,
                          venueB: { ...venueSettings.venueB, maleCount: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">女生人數</label>
                      <input
                        type="number"
                        min="0"
                        value={venueSettings.venueB.femaleCount}
                        onChange={(e) => setVenueSettings({
                          ...venueSettings,
                          venueB: { ...venueSettings.venueB, femaleCount: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    總人數: {venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount}人
                  </div>
                </div>
              </div>
            </div>

            {/* 總計資訊 */}
            <div className="mt-4 bg-green-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700">
                  總需求人數: {venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount + venueSettings.venueB.maleCount + venueSettings.venueB.femaleCount}人
                </div>
                <div className="text-sm text-green-600 mt-1">
                  男生: {venueSettings.venueA.maleCount + venueSettings.venueB.maleCount}人 | 
                  女生: {venueSettings.venueA.femaleCount + venueSettings.venueB.femaleCount}人
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 人員管理區域 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">人員名單 ({staff.length}/36)</h2>
          <div className="flex gap-2">
            <div className="bg-green-100 px-3 py-2 rounded-lg text-sm text-green-800">
              ✅ 名單已載入完成
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 w-4 h-4" />
              新增人員
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="姓名"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              />
              <select
                value={newStaff.gender}
                onChange={(e) => setNewStaff({...newStaff, gender: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">選擇性別</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
              <select
                value={newStaff.preference}
                onChange={(e) => setNewStaff({...newStaff, preference: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">場地偏好</option>
                <option value="A">A場</option>
                <option value="B">B場</option>
              </select>
              <input
                type="text"
                placeholder="綁定對象姓名"
                value={newStaff.bondedWith}
                onChange={(e) => setNewStaff({ ...newStaff, bondedWith: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={addStaff}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                確認新增
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 人員列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((person) => (
            <div key={person.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{person.name}</div>
                  <div className="text-sm text-gray-600">
                    {person.gender}
                    {person.preference && ` • 偏好${person.preference}場`}
                  </div>
                  {person.bondedWith && (
                    <div className="text-sm text-blue-600 flex items-center">
                      <Link className="w-3 h-3 mr-1" />與 {person.bondedWith} 綁定
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeStaff(person.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 統計資訊 */}
        {staff.length > 0 && (
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{staff.length}</div>
                <div className="text-gray-600">
                  總人數/
                  {venueSettings.venueA.maleCount +
                    venueSettings.venueA.femaleCount +
                    venueSettings.venueB.maleCount +
                    venueSettings.venueB.femaleCount}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-blue-600">
                  {staff.filter((s) => s.gender === '男').length}
                </div>
                <div className="text-gray-600">男生人數</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-pink-600">
                  {staff.filter((s) => s.gender === '女').length}
                </div>
                <div className="text-gray-600">女生人數</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">{bonds.length}</div>
                <div className="text-gray-600">綁定對數</div>
              </div>
            </div>
            {(staff.filter((s) => s.gender === '男').length !==
              venueSettings.venueA.maleCount + venueSettings.venueB.maleCount ||
              staff.filter((s) => s.gender === '女').length !==
                venueSettings.venueA.femaleCount +
                  venueSettings.venueB.femaleCount) && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded text-yellow-700 text-sm">
                ⚠️ 注意：需要男生
                {venueSettings.venueA.maleCount + venueSettings.venueB.maleCount}
                人，女生
                {venueSettings.venueA.femaleCount + venueSettings.venueB.femaleCount}
                人才能進行平衡分配 (目前: 男
                {staff.filter((s) => s.gender === '男').length}人, 女
                {staff.filter((s) => s.gender === '女').length}人)
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分配操作區域 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={autoAssign}
            disabled={staff.length !== 36}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center"
          >
            <Shuffle className="mr-2 w-5 h-5" />
            智能分配
          </button>
          <button
            onClick={exportResults}
            disabled={assignments.venueA.length === 0 && assignments.venueB.length === 0}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
          >
            <Download className="mr-2 w-5 h-5" />
            匯出結果
          </button>
        </div>
      </div>

      {/* 分配結果顯示 */}
      {(assignments.venueA.length > 0 || assignments.venueB.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* A場地 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2 text-red-500" />
              A場地 ({assignments.venueA.length}/18)
            </h3>

            <div className="mb-4 bg-red-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>男: {getStats(assignments.venueA).males}</span>
                <span>女: {getStats(assignments.venueA).females}</span>
                <span>總計: {getStats(assignments.venueA).total}</span>
              </div>
            </div>

            <div className="space-y-2">
              {assignments.venueA.map((person) => (
                <div key={person.id} className="border rounded-lg p-3 bg-red-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {person.name} ({person.gender})
                      </div>
                      {person.bondedWith && (
                        <div className="text-xs text-blue-600 flex items-center">
                          <Link className="w-3 h-3 mr-1" />與 {person.bondedWith} 綁定
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => moveStaff(person, 'venueA', 'venueB')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={assignments.venueB.length >= 18}
                    >
                      移至B場 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B場地 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2 text-blue-500" />
              B場地 ({assignments.venueB.length}/18)
            </h3>

            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>男: {getStats(assignments.venueB).males}</span>
                <span>女: {getStats(assignments.venueB).females}</span>
                <span>總計: {getStats(assignments.venueB).total}</span>
              </div>
            </div>

            <div className="space-y-2">
              {assignments.venueB.map((person) => (
                <div key={person.id} className="border rounded-lg p-3 bg-blue-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {person.name} ({person.gender})
                      </div>
                      {person.bondedWith && (
                        <div className="text-xs text-blue-600 flex items-center">
                          <Link className="w-3 h-3 mr-1" />與 {person.bondedWith} 綁定
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => moveStaff(person, 'venueB', 'venueA')}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={assignments.venueA.length >= (venueSettings.venueA.maleCount + venueSettings.venueA.femaleCount)}
                    >
                      ← 移至A場
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAssignmentTool;