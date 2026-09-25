const backdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
let employees = [];

async function loadEmployees() {
    try {
        employees = await api.get('/employees');
        renderEmployees(employees);
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

function renderEmployees(list) {
    const body = document.getElementById('productsBody');
    if (list.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="table-empty">No cashiers found.</td></tr>`;
        return;
    }
    body.innerHTML = list.map(e => `<tr>
        <td><i class="fas fa-user"></i> ${escapeHtml(e.first_name)} ${syncName(e.last_name)}</td>
        <td>${escapeHtml(e.email)}</td>
        <td>Cashier</td>
        4td>
            <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${e.id}, '${escapeHtml(e.first_name)}')"><i class="fas fa-trash"></i></button>
        </td>
    </tr>`).join('');
}

function syncName(n) { return n ? escapeHtml(n) : ''; }

async function deleteEmployee(id, name) {
    if (!confirm(`Remove cashier ${[�[Y_O�
JH�]\���B��H�B�]�Z]\K�[
	��[\�YY\���
�Y
N�B���ӛ�Y�X�][ۊ	�[\�YYH�[[ݙY��	��X��\���N�B��Y[\�YY\�
N�B�H�]�
\��H�B���ӛ�Y�X�][ۊ\���Y\��Y�K	�\��܉�N�B�CB�CB�B���[Y[���][[Y[��RY
	��[�Y���K�Y]�[�\�[�\�	��X���

HO��B���[Y[���][[Y[��RY
	ٓ�[YI�K��[YHH	���B���[Y[���][[Y[��RY
	ِ�]Y�ܞI�K��[YHH	���B���[Y[���][[Y[��RY
	ٔ�X�I�K��[YHH	���B�[�[]K�^�۝[�H	�Y�\�Y\���B��X������\��\��Y
	��[��N�B�JN�B���[Y[���][[Y[��RY
	�[�[���I�K�Y]�[�\�[�\�	��X���

HO��X������\��\���[[ݙJ	��[��JN�B���[Y[���][[Y[��RY
	�[�[�[��[	�K�Y]�[�\�[�\�	��X���

HO��X������\��\���[[ݙJ	��[��JN�B�B���[Y[���][[Y[��RY
	�[�[�]�I�K�Y]�[�\�[�\�	��X���\�[��

HO��B��ۜ�^[�YH�B��\���[YN���[Y[���][[Y[��RY
	ٓ�[YI�K��[YK��[J
KB�[XZ[���[Y[���][[Y[��RY
	ِ�]Y�ܞI�K��[YK��[J
KB�\���ܙ���[Y[���][[Y[��RY
	ٔ�X�I�K��[YCB�N�B�Y�
\^[�Y��\���[YH\^[�Y�[XZ[\^[�Y�\���ܙ
H�B���ӛ�Y�X�][ۊ	њ[[�Y[��	�\��܉�N�B��]\���B�CB��H�B�]�Z]\K���
	��[\�YY\��^[�Y
N�B���ӛ�Y�X�][ۊ	��\�Y\�YYI�	��X��\���N�B��X������\��\���[[ݙJ	��[��N�B��Y[\�YY\�
N�B�H�]�
\��H�B���ӛ�Y�X�][ۊ\���Y\��Y�K	�\��܉�N�B�CB�JN�B�B��Y[\�YY\�
N