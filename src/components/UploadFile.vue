<script setup>
import {ref, onMounted, computed} from 'vue'
import {upload} from '@/api'
import {creatChunks, uploadChunks} from '@/utils/chunkUpload.js'

//允许上传的文件类型
const accept = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'docx']

onMounted(() => {
  //拖拽文件
  const dragDiv = document.getElementById('dragDiv')
  dragDiv.ondragenter = (e) => {
    e.preventDefault()
  }
  dragDiv.ondragover = (e) => {
    e.preventDefault()
  }
  dragDiv.ondrop = (e) => {
    e.preventDefault()
    const items = e.dataTransfer.items;
    console.log(items.length)
    for (const item of items) {
      const entry = item.webkitGetAsEntry()
      parseFiles(entry)
    }
  }
})

//处理拖拽后的文件和文件夹
const parseFiles = (entry) => {
  if (entry.isFile) {
    //处理文件
    entry.file((file) => {
      const type = file.name?.split('.')[1]
      accept.includes(type) && tableData.value.push({
        id: tableData.value.length + 1,
        name: file.name,
        size: file.size,
        type,
        file,
        percentage: 0,//上传进度默认为0
        status: '1', //初始状态:未上传
      })
    })
  } else {
    //处理文件夹
    const reader = entry.createReader()
    reader.readEntries((entries) => {
      for (const e of entries) {
        parseFiles(e)
      }
    })
  }
}

//选择文件
const selectFile = () => {
  document.getElementById('file').click()
}
//选择文件夹
const selectFolder = () => {
  document.getElementById('folder').click()
}

//文件列表
const tableData = ref([])
const getText = (value, data) => data.find(item => item.value === value)?.key || ''
const status = [
  {key: '未上传', value: '1'},
  {key: '上传成功', value: '2'},
  {key: '上传失败', value: '3'},
]

//删除文件
const delFile = (file) => {
  tableData.value = tableData.value.filter(item => item.id !== file.id)
}
//成功上传数量
const successNum = ref(0)
//总大小
const size = computed(() => {
  const total = tableData.value.reduce((pre, cur) => {
    return pre + cur?.size
  }, 0)
  return total ? (total / 1024 / 1024).toFixed(2) : 0
})

//开始上传
const uploadFile = () => {
  tableData.value.forEach(async (item) => {
    //上传状态为成功的不再上传
    if (item.status === '2') return
    const maxSize = 1024 * 1024 * 5 //单个文件最大为5M
    if (item?.size > maxSize) {
      //切片上传
      const chunks = creatChunks(item?.file)
      console.log('chunks', chunks)
      await uploadChunks(chunks, item?.name)
    } else {
      //直接上传
      const formData = new FormData()
      item.status = '4' //状态改为上传中
      formData.append('file', item?.file)
      try {
        await upload(formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progress => {
            const percentage = Math.round((progress.loaded / progress.total) * 100)
            console.log(percentage)
            item.percentage = percentage
          }
        })
        item.status = '2'
      } catch (e) {
        console.error(e)
        item.status = '3'
      }
    }
    if (item.status === '2') return
    const formData = new FormData()
    item.status = '4' //状态改为上传中
    formData.append('file', item?.file)
    try {
      const res = await upload(formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progress => {
          const percentage = Math.round((progress.loaded / progress.total) * 100)
          console.log(percentage)
          item.percentage = percentage
        }
      })
      console.log(res)
      item.status = '2'
    } catch (e) {
      console.error(e)
      item.status = '3'
    }
  })
}
</script>

<template>
  <input type="file" id="file" style="display: none" multiple>
  <input type="file" id="folder" style="display: none" multiple webkitdirectory directory>
  <div class="upload" id="dragDiv">
    <div class="upload-header">
      <img src="../assets/upload.png" alt="上传">
      <span>将目录或多个文件拖拽到此区域进行上传</span>
    </div>
    <span class="mt16">支持的文件类型: .jpg、.jepg、.bmp、.webp、.gif、.png、.pdf</span>
  </div>

  <div class="mt16">
    <el-button type="primary" @click="selectFile">选择文件</el-button>
    <el-button type="primary" @click="selectFolder">选择文件夹</el-button>
  </div>

  <el-table :data="tableData" class="table mt16">
    <template #empty>
      <el-empty/>
    </template>
    <el-table-column prop="name" label="文件名" align="center"/>
    <el-table-column prop="type" label="类型" align="center"/>
    <el-table-column prop="size" label="大小(MB)" align="center">
      <template #default="scope">
        {{ (scope.row.size / 1024 / 1024).toFixed(2) }}
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" align="center">
      <template #default="scope">
        <el-progress v-if="scope.row.status==='4'" :percentage="scope.row.percentage"/>
        <span v-else>{{ getText(scope.row.status, status) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center">
      <template #default="scope">
        <el-button type="danger" text @click="delFile(scope.row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <div class="mt16">
    <el-tag type="info" color="#fff">文件数量 {{ tableData.length }}</el-tag>
    <el-tag type="success" class="ml10">成功上传 {{ successNum }}</el-tag>
    <el-tag type="info" color="#fff" class="ml10">总大小 {{ size }}MB</el-tag>
  </div>

  <el-button class="mt16" type="primary" @click="uploadFile">开始上传</el-button>
</template>

<style lang="scss" scoped>
.upload {
  height: 200px;
  width: 100%;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .upload-header {
    display: flex;
    align-items: center;

    img {
      width: 24px;
      height: 24px;
    }
  }
}

.table {
  border: 1px solid #d9d9d9;
  border-radius: 6px;

  :deep(.el-table__empty-block) {
    width: 100% !important;
  }
}

.mt16 {
  margin-top: 16px;
}

.ml10 {
  margin-left: 10px;
}
</style>
