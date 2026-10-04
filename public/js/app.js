function setOptions(select, placeholder, items, labelFn, decorateFn) {
  select.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item._id;
    option.textContent = labelFn(item);
    if (decorateFn) decorateFn(option, item);
    select.appendChild(option);
  });

  select.disabled = items.length === 0;
}

document.addEventListener('DOMContentLoaded', () => {
  const customerForm = document.querySelector('[data-customer-form]');
  if (!customerForm) return;

  const floorSelect = customerForm.querySelector('[data-floor-select]');
  const roomSelect = customerForm.querySelector('[data-room-select]');
  const bedSelect = customerForm.querySelector('[data-bed-select]');
  const rentInput = customerForm.querySelector('#monthlyRent');

  floorSelect.addEventListener('change', async () => {
    setOptions(roomSelect, 'Choose room', [], (room) => room.roomNumber);
    setOptions(bedSelect, 'Choose bed', [], (bed) => `Bed ${bed.bedNumber}`);
    if (!floorSelect.value) return;

    const response = await fetch(`/rooms/api/by-floor/${floorSelect.value}`);
    const rooms = await response.json();
    setOptions(
      roomSelect,
      'Choose room',
      rooms,
      (room) => `Room ${room.roomNumber} - ${room.sharingType} Sharing`,
      (option, room) => {
        option.dataset.rent = room.monthlyRent;
      }
    );
  });

  roomSelect.addEventListener('change', async () => {
    setOptions(bedSelect, 'Choose bed', [], (bed) => `Bed ${bed.bedNumber}`);
    if (!roomSelect.value) return;

    const selectedRoom = roomSelect.options[roomSelect.selectedIndex];
    if (selectedRoom.dataset.rent) rentInput.value = selectedRoom.dataset.rent;

    const response = await fetch(`/rooms/api/${roomSelect.value}/available-beds`);
    const beds = await response.json();
    setOptions(bedSelect, 'Choose bed', beds, (bed) => `Bed ${bed.bedNumber}`);
  });
});
